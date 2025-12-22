import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { getCommentsForProcess, addCommentToProcess } from '@/apis/commentsApi';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
}

interface CommentsPanelProps {
  processID: string;
}

export default function CommentsPanel({ processID }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Load comments when component mounts
  useEffect(() => {
    loadComments();
  }, [processID]);

  const loadComments = async () => {
    try {
      const data = await getCommentsForProcess(processID);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const addedComment = await addCommentToProcess(processID, newComment);
      setComments([...comments, addedComment]);
      setNewComment('');
      toast({
        title: 'Comment added',
        status: 'success',
        duration: 2000,
        position: 'top-right',
      });
    } catch (error) {
      toast({
        title: 'Failed to add comment',
        status: 'error',
        duration: 2000,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
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
      {/* Comments List */}
      <VStack
        flex={1}
        spacing={4}
        align="stretch"
        overflowY="auto"
        mb={4}
        pr={2}
      >
        {comments.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500" fontSize="sm">
              No comments yet. Be the first to comment!
            </Text>
          </Box>
        ) : (
          comments.map((comment) => (
            <Box key={comment.id}>
              <HStack align="start" spacing={3}>
                <Avatar
                  size="sm"
                  name={comment.author.name}
                  src={comment.author.avatar}
                />
                <Box flex={1}>
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="medium" fontSize="sm">
                      {comment.author.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {formatTimestamp(comment.timestamp)}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.700">
                    {comment.content}
                  </Text>
                </Box>
              </HStack>
              <Divider mt={3} />
            </Box>
          ))
        )}
      </VStack>

      {/* Add Comment Form */}
      <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
        <VStack spacing={3}>
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            size="sm"
            resize="vertical"
            minH="80px"
          />
          <Button
            colorScheme="teal"
            size="sm"
            w="100%"
            onClick={handleAddComment}
            isLoading={isLoading}
            isDisabled={!newComment.trim()}
          >
            Add Comment
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}

