import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { userSelector } from '@/redux/selector';
import { wsService } from '@/services/websocket.service';
import { useToast } from '@chakra-ui/react';

export interface ActiveUser {
  userId: string;
  userName: string;
  color: string;
  cursor?: { x: number; y: number };
  editingElement?: string;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  position: { x: number; y: number };
}

export const useCollaboration = (processId?: string) => {
  const router = useRouter();
  const { workspaceId } = router.query;
  const user = useSelector(userSelector);
  const toast = useToast();
  
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [editingElements, setEditingElements] = useState<Map<string, string>>(new Map());

  // Connect to workspace
  useEffect(() => {
    if (!workspaceId || !user) return;

    console.log('🔌 Connecting to workspace:', workspaceId);

    const socket = wsService.connect(
      workspaceId as string,
      user.id.toString(),
      user.name
    );

    // Setup event listeners
    const handleConnect = () => {
      setIsConnected(true);
      toast({
        title: 'Connected',
        description: 'Real-time collaboration enabled',
        status: 'success',
        duration: 2000,
        position: 'bottom-right',
      });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      toast({
        title: 'Disconnected',
        description: 'Real-time collaboration disabled',
        status: 'warning',
        duration: 2000,
        position: 'bottom-right',
      });
    };

    const handleActiveUsers = (users: ActiveUser[]) => {
      setActiveUsers(users.filter(u => u.userId !== user.id.toString()));
    };

    const handleUserJoined = (data: any) => {
      if (data.userId === user.id.toString()) return;
      
      toast({
        title: `${data.userName} joined`,
        status: 'info',
        duration: 2000,
        position: 'bottom-right',
      });
    };

    const handleUserLeft = (data: any) => {
      toast({
        title: `${data.userName} left`,
        status: 'info',
        duration: 2000,
        position: 'bottom-right',
      });
    };

    const handleCursorMoved = (data: CursorPosition) => {
      setCursors(prev => {
        const filtered = prev.filter(c => c.userId !== data.userId);
        return [...filtered, data];
      });

      // Remove cursor after 3 seconds of inactivity
      setTimeout(() => {
        setCursors(prev => prev.filter(c => c.userId !== data.userId));
      }, 3000);
    };

    const handleUserEditing = (data: any) => {
      setEditingElements(prev => {
        const newMap = new Map(prev);
        if (data.isEditing) {
          newMap.set(data.elementId, data.userName);
        } else {
          newMap.delete(data.elementId);
        }
        return newMap;
      });
    };

    const handleLockAcquired = (data: any) => {
      if (data.userId !== user.id.toString()) {
        toast({
          title: 'Element locked',
          description: `${data.userName} is editing this element`,
          status: 'info',
          duration: 2000,
          position: 'bottom-right',
        });
      }
    };

    const handleProcessUpdated = (data: any) => {
      if (data.userId !== user.id.toString()) {
        toast({
          title: 'Process updated',
          description: `${data.userName} made changes`,
          status: 'info',
          duration: 2000,
          position: 'bottom-right',
        });
      }
    };

    wsService.on('connect', handleConnect);
    wsService.on('disconnect', handleDisconnect);
    wsService.on('active-users', handleActiveUsers);
    wsService.on('user-joined', handleUserJoined);
    wsService.on('user-left', handleUserLeft);
    wsService.on('cursor-moved', handleCursorMoved);
    wsService.on('user-editing', handleUserEditing);
    wsService.on('lock-acquired', handleLockAcquired);
    wsService.on('process-updated', handleProcessUpdated);

    return () => {
      wsService.off('connect', handleConnect);
      wsService.off('disconnect', handleDisconnect);
      wsService.off('active-users', handleActiveUsers);
      wsService.off('user-joined', handleUserJoined);
      wsService.off('user-left', handleUserLeft);
      wsService.off('cursor-moved', handleCursorMoved);
      wsService.off('user-editing', handleUserEditing);
      wsService.off('lock-acquired', handleLockAcquired);
      wsService.off('process-updated', handleProcessUpdated);
      wsService.disconnect();
    };
  }, [workspaceId, user, toast]);

  // Join process room
  useEffect(() => {
    if (!processId || !isConnected) return;

    console.log('📄 Joining process room:', processId);
    wsService.joinProcessRoom(processId);

    return () => {
      console.log('📄 Leaving process room:', processId);
      wsService.leaveProcessRoom(processId);
    };
  }, [processId, isConnected]);

  // Send cursor position (debounced)
  const sendCursorPosition = useCallback((position: { x: number; y: number }) => {
    if (!processId) return;
    wsService.sendCursorPosition(processId, position);
  }, [processId]);

  // Send editing status
  const sendEditingStatus = useCallback((elementId: string, isEditing: boolean) => {
    if (!processId) return;
    wsService.sendEditingStatus(processId, elementId, isEditing);
  }, [processId]);

  // Request lock
  const requestLock = useCallback(async (elementId: string) => {
    if (!processId) return { success: false };
    
    try {
      const result = await wsService.requestLock(processId, elementId);
      return result;
    } catch (error: any) {
      toast({
        title: 'Cannot edit',
        description: error.message || 'Element is locked by another user',
        status: 'error',
        duration: 3000,
        position: 'bottom-right',
      });
      return { success: false };
    }
  }, [processId, toast]);

  // Release lock
  const releaseLock = useCallback((elementId: string) => {
    if (!processId) return;
    wsService.releaseLock(processId, elementId);
  }, [processId]);

  // Send process update
  const sendProcessUpdate = useCallback((changes: any) => {
    if (!processId) return;
    wsService.sendProcessUpdate(processId, changes);
  }, [processId]);

  // Check if element is being edited
  const isElementLocked = useCallback((elementId: string) => {
    return editingElements.has(elementId);
  }, [editingElements]);

  // Get who is editing element
  const getElementEditor = useCallback((elementId: string) => {
    return editingElements.get(elementId);
  }, [editingElements]);

  return {
    activeUsers,
    cursors,
    isConnected,
    sendCursorPosition,
    sendEditingStatus,
    requestLock,
    releaseLock,
    sendProcessUpdate,
    isElementLocked,
    getElementEditor,
  };
};
