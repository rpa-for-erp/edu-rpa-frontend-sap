import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Textarea,
  Button,
  Divider,
  useToast,
  Badge,
  Spinner,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { MdRefresh, MdCheck } from 'react-icons/md';
import { useSelector } from 'react-redux';
import { getCommentsForProcess } from '@/apis/commentsApi';
import { useCommentSocket } from '@/hooks/useCommentSocket';
import { Comment } from '@/interfaces/comment';
import { userSelector } from '@/redux/selector';

// Extended comment type with pending status for optimistic updates
interface OptimisticComment extends Comment {
  isPending?: boolean;
  tempId?: string;
}

interface CommentsPanelProps {
  processID: string;
  selectedElementId?: string;
  selectedElementName?: string;
}

export default function CommentsPanel({
  processID,
  selectedElementId,
  selectedElementName,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<OptimisticComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  
  // Get current user from redux
  const currentUser = useSelector(userSelector);
  
  // Track if initial load has been done
  const hasLoadedRef = useRef(false);
  
  // Track pending comments by tempId for matching with server response
  const pendingCommentsRef = useRef<Map<string, OptimisticComment>>(new Map());

  // Handle new comment from WebSocket - update pending comment or add new
  const handleCommentAdded = useCallback((comment: Comment) => {

    setComments((prev) => {
      // Check if this matches a pending comment (same content, elementId, and user)
      const pendingIndex = prev.findIndex(
        (c) => c.isPending && 
               c.content === comment.content && 
               c.elementId === comment.elementId &&
               c.createdBy.id === String(currentUser.id)
      );

      if (pendingIndex !== -1) {
        // Update the pending comment with server data (confirmed)
        const updated = [...prev];
        updated[pendingIndex] = {
          ...comment,
          isPending: false,
        };

        return updated;
      }
      
      // Check if comment already exists by ID (avoid duplicates)
      if (prev.some((c) => c.id === comment.id)) {
        return prev;
      }
      
      // New comment from another user
      console.log('[CommentsPanel] Added new comment from other user');
      return [...prev, comment];
    });
  }, [currentUser.id]);

  // Handle comment update from WebSocket
  const handleCommentUpdated = useCallback((updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? { ...updatedComment, isPending: false } : c))
    );
  }, []);

  // Handle comment deletion from WebSocket
  const handleCommentDeleted = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  // Initialize WebSocket connection
  const { socketState, sendComment: sendCommentViaSocket } = useCommentSocket({
    processId: processID,
    onCommentAdded: handleCommentAdded,
    onCommentUpdated: handleCommentUpdated,
    onCommentDeleted: handleCommentDeleted,
    autoConnect: true,
  });

  // Load comments from API (only called once on mount or manual refresh)
  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCommentsForProcess(processID);
      // Keep any pending comments that haven't been confirmed yet
      setComments((prev) => {
        const pendingComments = prev.filter((c) => c.isPending);
        // Merge: server data + pending comments (avoiding duplicates)
        const serverIds = new Set(data.map((c) => c.id));
        const uniquePending = pendingComments.filter((c) => !serverIds.has(c.id));
        return [...data, ...uniquePending];
      });
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast({
        title: 'Failed to load comments',
        status: 'error',
        duration: 3000,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  }, [processID, toast]);

  // Load comments ONLY ONCE when component mounts
  useEffect(() => {
    if (processID && !hasLoadedRef.current) {
      loadComments();
    }
  }, [processID]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset loaded state when processID changes
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [processID]);

  // Filter comments by selected element
  const filteredComments = useMemo(() => {
    if (!selectedElementId) {
      return comments;
    }
    // Filter comments for the currently selected node
    return comments.filter((c) => c.elementId === selectedElementId);
  }, [comments, selectedElementId]);

  // Handle adding a new comment with optimistic update
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    if (!selectedElementId) {
      toast({
        title: 'Please select an element',
        description: 'Select a BPMN element to add a comment',
        status: 'warning',
        duration: 2000,
        position: 'top-right',
      });
      return;
    }

    if (!socketState.isConnected) {
      toast({
        title: 'Not connected',
        description: 'Please wait for connection to be established',
        status: 'warning',
        duration: 2000,
        position: 'top-right',
      });
      return;
    }

    const commentText = newComment.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create optimistic comment immediately
    const optimisticComment: OptimisticComment = {
      id: tempId,
      tempId,
      content: commentText,
      processId: processID,
      elementId: selectedElementId,
      createdBy: {
        id: String(currentUser.id),
        name: currentUser.name || 'You',
        email: currentUser.email,
        avatar: currentUser.avatarUrl || undefined,
      },
      createdAt: new Date().toISOString(),
      isPending: true,
    };
    
    // Add to comments immediately (optimistic update)
    setComments((prev) => [...prev, optimisticComment]);
    
    // Track pending comment
    pendingCommentsRef.current.set(tempId, optimisticComment);
    
    // Clear input immediately
    setNewComment('');
    
    // Send via WebSocket
    sendCommentViaSocket(commentText, selectedElementId);
    
    // Set timeout to handle case when server doesn't respond
    setTimeout(() => {
      setComments((prev) => {
        const comment = prev.find((c) => c.tempId === tempId);
        if (comment?.isPending) {
          // Still pending after timeout - mark as failed or just keep it
          console.warn('[CommentsPanel] Comment confirmation timeout for:', tempId);
        }
        return prev;
      });
      pendingCommentsRef.current.delete(tempId);
    }, 10000);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string, isPending?: boolean) => {
    if (isPending) {
      return 'Sending...';
    }
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box p={4} height="100%" display="flex" flexDirection="column">
      {/* Header with element info and connection status */}
      <HStack mb={4} justify="space-between">
        <HStack spacing={2}>
          {selectedElementId ? (
            <Badge colorScheme="teal" fontSize="xs">
              {selectedElementName || selectedElementId}
            </Badge>
          ) : (
            <Text fontSize="sm" color="gray.500">
              Select an element
            </Text>
          )}
        </HStack>
        <HStack spacing={2}>
          <Tooltip label={socketState.isConnected ? 'Real-time connected' : 'Offline'}>
            <Badge
              colorScheme={socketState.isConnected ? 'green' : 'gray'}
              variant="subtle"
            >
              {socketState.isConnected ? 'Live' : 'Offline'}
            </Badge>
          </Tooltip>
          <Tooltip label="Refresh comments">
            <IconButton
              aria-label="Refresh comments"
              icon={<MdRefresh />}
              size="sm"
              variant="ghost"
              onClick={loadComments}
              isLoading={isLoading}
            />
          </Tooltip>
        </HStack>
      </HStack>

      {/* Comments List */}
      <VStack
        flex={1}
        spacing={4}
        align="stretch"
        overflowY="auto"
        mb={4}
        pr={2}
        className="custom-scrollbar"
      >
        {isLoading ? (
          <Box textAlign="center" py={8}>
            <Spinner size="md" color="teal.500" />
            <Text color="gray.500" fontSize="sm" mt={2}>
              Loading comments...
            </Text>
          </Box>
        ) : !selectedElementId ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500" fontSize="sm">
              Select a BPMN element to view its comments
            </Text>
          </Box>
        ) : filteredComments.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500" fontSize="sm">
              No comments for this element yet.
            </Text>
          </Box>
        ) : (
          filteredComments.map((comment) => {
            // Check if this comment is from the current user
            const isMe = String(currentUser.id) === comment.createdBy.id;
            
            return (
              <Box 
                key={comment.id} 
                opacity={comment.isPending ? 0.7 : 1}
                transition="opacity 0.2s"
                bg={isMe ? 'teal.50' : 'transparent'}
                p={isMe ? 2 : 0}
                borderRadius={isMe ? 'md' : 'none'}
                borderLeft={isMe ? '3px solid' : 'none'}
                borderLeftColor={isMe ? 'teal.400' : 'transparent'}
              >
                <HStack align="start" spacing={3}>
                  <Avatar
                    size="sm"
                    name={comment.createdBy.name}
                    src={comment.createdBy.avatar}
                    bg={isMe ? 'teal.500' : 'gray.400'}
                  />
                  <Box flex={1}>
                    <HStack justify="space-between" mb={1} flexWrap="wrap">
                      <HStack spacing={2}>
                        <Text fontWeight="medium" fontSize="sm" color={isMe ? 'teal.700' : 'gray.800'}>
                          {isMe ? 'You' : comment.createdBy.name}
                        </Text>
                        {isMe && !comment.isPending && (
                          <Badge colorScheme="teal" fontSize="xs" variant="subtle">
                            me
                          </Badge>
                        )}
                        {comment.isPending && (
                          <Spinner size="xs" color="gray.400" />
                        )}
                      </HStack>
                      <HStack spacing={1}>
                        {!comment.isPending && (
                          <MdCheck size={12} color="green" />
                        )}
                        <Text 
                          fontSize="xs" 
                          color={comment.isPending ? 'orange.500' : 'gray.500'}
                          fontStyle={comment.isPending ? 'italic' : 'normal'}
                        >
                          {formatTimestamp(comment.createdAt, comment.isPending)}
                        </Text>
                      </HStack>
                    </HStack>
                    <Text fontSize="sm" color={isMe ? 'teal.800' : 'gray.700'}>
                      {comment.content}
                    </Text>
                  </Box>
                </HStack>
                <Divider mt={3} />
              </Box>
            );
          })
        )}
      </VStack>

      {/* Add Comment Form */}
      <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
        {selectedElementId && (
          <Text fontSize="xs" color="gray.500" mb={2}>
            Commenting on: {selectedElementName || selectedElementId}
          </Text>
        )}
        <VStack spacing={3}>
          <Textarea
            placeholder={
              selectedElementId
                ? `Add a comment on "${selectedElementName || selectedElementId}"...`
                : 'Select an element to comment...'
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            size="sm"
            resize="vertical"
            minH="80px"
            isDisabled={!selectedElementId}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleAddComment();
              }
            }}
          />
          <HStack w="100%" justify="space-between">
            <Text fontSize="xs" color="gray.400">
              Ctrl+Enter to send
            </Text>
            <Button
              colorScheme="teal"
              size="sm"
              onClick={handleAddComment}
              isDisabled={!newComment.trim() || !selectedElementId || !socketState.isConnected}
            >
              Add Comment
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
