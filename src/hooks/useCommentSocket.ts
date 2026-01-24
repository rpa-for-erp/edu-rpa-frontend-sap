/**
 * useCommentSocket Hook
 *
 * Manages WebSocket connection for real-time comment updates.
 * Handles joining/leaving comment rooms and listening for comment events.
 * 
 * BE Gateway: /ws/process-comments namespace
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getLocalStorageObject } from '@/utils/localStorageService';
import { LocalStorage } from '@/constants/localStorage';
import {
  Comment,
  CommentResponse,
  CommentSocketState,
} from '@/interfaces/comment';
import { useSelector } from 'react-redux';
import { userSelector } from '@/redux/selector';

/**
 * Transform API/Socket response to normalized Comment format
 */
const transformComment = (response: CommentResponse): Comment => ({
  id: response.id,
  content: response.commentText,
  processId: response.process_id,
  processVersionId: response.process_version_id,
  elementId: response.node_id,
  createdBy: {
    id: String(response.user?.id),
    name: response.user?.name,
    email: response.user?.email,
    avatar: response.user?.avatarUrl || undefined,
  },
  createdAt: response.createdAt,
});

interface UseCommentSocketOptions {
  processId: string;
  onCommentAdded?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  autoConnect?: boolean;
}

interface UseCommentSocketReturn {
  socketState: CommentSocketState;
  sendComment: (commentText: string, nodeId?: string) => void;
  connect: () => void;
  disconnect: () => void;
  joinRoom: () => void;
  leaveRoom: () => void;
}

// BE WebSocket namespace for process comments
const WS_BASE_URL = process.env.NEXT_PUBLIC_DEV_API;
const WS_NAMESPACE = '/ws/process-comments';

export function useCommentSocket({
  processId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  autoConnect = true,
}: UseCommentSocketOptions): UseCommentSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [socketState, setSocketState] = useState<CommentSocketState>({
    isConnected: false,
    isJoined: false,
  });
  const currentUser = useSelector(userSelector);
  // Store callbacks in refs to avoid re-creating socket listeners
  const onCommentAddedRef = useRef(onCommentAdded);
  const onCommentUpdatedRef = useRef(onCommentUpdated);
  const onCommentDeletedRef = useRef(onCommentDeleted);

  // Update refs when callbacks change
  useEffect(() => {
    onCommentAddedRef.current = onCommentAdded;
    onCommentUpdatedRef.current = onCommentUpdated;
    onCommentDeletedRef.current = onCommentDeleted;
  }, [onCommentAdded, onCommentUpdated, onCommentDeleted]);

  // Connect to WebSocket with namespace
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[CommentSocket] Already connected');
      return;
    }

    const accessToken = getLocalStorageObject(LocalStorage.ACCESS_TOKEN);
    
    // Connect to the specific namespace: /ws/process-comments
    const wsUrl = `${WS_BASE_URL}${WS_NAMESPACE}`;
    console.log('[CommentSocket] Connecting to:', wsUrl);

    socketRef.current = io(wsUrl, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('[CommentSocket] Connected to namespace:', WS_NAMESPACE);
      setSocketState((prev) => ({ ...prev, isConnected: true, error: undefined }));
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[CommentSocket] Disconnected:', reason);
      setSocketState({ isConnected: false, isJoined: false });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[CommentSocket] Connection error:', error);
      setSocketState((prev) => ({
        ...prev,
        isConnected: false,
        error: error.message,
      }));
    });

    // Comment events - transform from API format to normalized format
    socketRef.current.on('commentAdded', (data: CommentResponse) => {
      console.log('[CommentSocket] Comment added (raw):', data);
      const comment = transformComment(data);
      onCommentAddedRef.current?.(comment);
    });

    socketRef.current.on('commentUpdated', (data: CommentResponse) => {
      console.log('[CommentSocket] Comment updated (raw):', data);
      const comment = transformComment(data);
      onCommentUpdatedRef.current?.(comment);
    });

    socketRef.current.on('commentDeleted', ({ commentId }: { commentId: string }) => {
      console.log('[CommentSocket] Comment deleted:', commentId);
      onCommentDeletedRef.current?.(commentId);
    });
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketState({ isConnected: false, isJoined: false });
    }
  }, []);

  // Join comment room - only processId needed, BE handles version
  const joinRoom = useCallback(() => {
    if (!socketRef.current?.connected) {
      console.warn('[CommentSocket] Cannot join room - not connected');
      return;
    }

    const payload = { processId };

    console.log('[CommentSocket] Joining room with payload:', payload);
    socketRef.current.emit('joinCommentRoom', payload);
    console.log('[CommentSocket] Joined room for process:', processId);
    setSocketState((prev) => ({ ...prev, isJoined: true }));
  }, [processId]);

  // Leave comment room
  const leaveRoom = useCallback(() => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('leaveCommentRoom', { processId });
    setSocketState((prev) => ({ ...prev, isJoined: false }));
    console.log('[CommentSocket] Left room');
  }, [processId]);

  // Send a new comment
  const sendComment = useCallback(
    (commentText: string, nodeId?: string) => {
      console.log('[CommentSocket] Sending comment:', { commentText, nodeId, processId });
      
      if (!socketRef.current?.connected) {
        console.warn('[CommentSocket] Cannot send comment - not connected');
        return;
      }

      const payload = {
        processId,
        elementId: nodeId,
        commentText,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userAvatar: currentUser.avatarUrl,
      };

      console.log('[CommentSocket] Emitting addComment with payload:', payload);
      socketRef.current.emit('addComment', payload);
    },
    [processId]
  );

  // Auto-connect and join room on mount
  useEffect(() => {
    if (autoConnect && processId) {
      connect();
    }

    return () => {
      leaveRoom();
      disconnect();
    };
  }, [autoConnect, processId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join room when connected
  useEffect(() => {
    if (socketState.isConnected && !socketState.isJoined && processId) {
      joinRoom();
    }
  }, [socketState.isConnected, socketState.isJoined, processId, joinRoom]);

  return {
    socketState,
    sendComment,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
  };
}

export default useCommentSocket;
