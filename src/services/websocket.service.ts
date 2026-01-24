import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface UserSession {
  userId: string;
  userName: string;
  color: string;
  cursor?: { x: number; y: number };
  editingElement?: string;
}

class WorkspaceWebSocketService {
  private socket: Socket | null = null;
  private ydoc: Y.Doc | null = null;
  private provider: WebsocketProvider | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private userId: string | null = null;
  private workspaceId: string | null = null;
  private isConnecting: boolean = false;

  connect(workspaceId: string, userId: string, userName: string) {
    // Prevent duplicate connections to same workspace
    if (this.socket?.connected && this.workspaceId === workspaceId) {
      console.log('✅ Already connected to workspace:', workspaceId);
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('⏳ Connection already in progress...');
      return this.socket;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      console.log('🔄 Disconnecting existing socket before reconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = true;
    console.log(
      '🔌 Creating new WebSocket connection to workspace:',
      workspaceId
    );

    // Store for later use
    this.userId = userId;
    this.workspaceId = workspaceId;

    // Connect to Socket.IO server
    this.socket = io(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080',
      {
        auth: {
          token:
            typeof window !== 'undefined'
              ? localStorage.getItem('accessToken')
              : null,
        },
        query: {
          workspaceId,
          userId,
          userName,
        },
        transports: ['websocket', 'polling'],
      }
    );

    // Setup event listeners (includes connect handler that sets isConnecting = false)
    this.setupEventListeners();

    return this.socket;
  }

  joinProcessRoom(processId: string) {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }

    console.log('📤 Sending join-process:', {
      processId,
      userId: this.userId,
      workspaceId: this.workspaceId,
    });

    this.socket.emit('join-process', {
      processId,
      userId: this.userId,
      workspaceId: this.workspaceId,
    });

    // Initialize Yjs document for collaborative editing
    this.ydoc = new Y.Doc();

    // Note: For production, use actual WebSocket server
    // For now, we'll use local awareness without y-websocket server
    console.log(`Joined process room: ${processId}`);
  }

  leaveProcessRoom(processId: string) {
    if (!this.socket) return;

    this.socket.emit('leave-process', { processId });

    // Cleanup Yjs
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    if (this.ydoc) {
      this.ydoc.destroy();
      this.ydoc = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnecting = false;
      this.emit('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      this.isConnecting = false;
      this.emit('disconnect');
    });

    // User events
    this.socket.on('user-joined', (data: any) => {
      console.log('👤 User joined:', data);
      console.log('👥 activeUsers in user-joined event:', data.activeUsers);
      this.emit('user-joined', data);
    });

    this.socket.on('user-left', (data: any) => {
      console.log('👋 User left:', data);
      this.emit('user-left', data);
    });

    this.socket.on('active-users', (users: UserSession[]) => {
      console.log('👥 Active users:', users);
      this.emit('active-users', users);
    });

    // Process events
    this.socket.on('user-joined-process', (data: any) => {
      console.log('📄 User joined process:', data);
      this.emit('user-joined-process', data);
    });

    this.socket.on('user-left-process', (data: any) => {
      console.log('📄 User left process:', data);
      this.emit('user-left-process', data);
    });

    this.socket.on('process-updated', (data: any) => {
      console.log('🔄 Process updated:', data);
      this.emit('process-updated', data);
    });

    // Cursor events
    this.socket.on('cursor-moved', (data: any) => {
      this.emit('cursor-moved', data);
    });

    // Editing events
    this.socket.on('user-editing', (data: any) => {
      console.log('✏️ User editing:', data);
      this.emit('user-editing', data);
    });

    // Lock events
    this.socket.on('lock-acquired', (data: any) => {
      console.log('🔒 Lock acquired:', data);
      this.emit('lock-acquired', data);
    });

    this.socket.on('lock-released', (data: any) => {
      console.log('🔓 Lock released:', data);
      this.emit('lock-released', data);
    });

    // Conflict events
    this.socket.on('conflict-detected', (data: any) => {
      console.warn('⚠️ Conflict detected:', data);
      this.emit('conflict-detected', data);
    });
  }

  // Event emitter methods
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Send cursor position
  sendCursorPosition(processId: string, position: { x: number; y: number }) {
    if (!this.socket) return;

    this.socket.emit('cursor-move', {
      processId,
      position,
    });
  }

  // Send editing status
  sendEditingStatus(processId: string, elementId: string, isEditing: boolean) {
    if (!this.socket) return;

    this.socket.emit('editing-status', {
      processId,
      elementId,
      isEditing,
    });
  }

  // Request lock for editing
  requestLock(processId: string, elementId: string): Promise<any> {
    if (!this.socket) {
      return Promise.reject({
        success: false,
        message: 'Socket not connected',
      });
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        'request-lock',
        { processId, elementId },
        (response: any) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(response);
          }
        }
      );
    });
  }

  // Release lock
  releaseLock(processId: string, elementId: string) {
    if (!this.socket) return;

    this.socket.emit('release-lock', { processId, elementId });
  }

  // Send process update
  sendProcessUpdate(processId: string, changes: any) {
    if (!this.socket) {
      console.warn('⚠️ [WebSocket] Cannot send update - socket not connected');
      return;
    }

    console.log('📤 [WebSocket] Sending process update:', {
      processId,
      connected: this.socket.connected,
      xmlLength: changes.xml?.length || 0,
      activitiesCount: changes.activities?.length || 0,
    });

    this.socket.emit('process-update', {
      processId,
      changes,
    });
  }

  // Get Yjs document
  getYDoc() {
    return this.ydoc;
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    if (this.provider) {
      this.provider.destroy();
    }
    if (this.ydoc) {
      this.ydoc.destroy();
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.listeners.clear();
    console.log('✅ WebSocket disconnected and cleaned up');
  }
}

// Singleton instance
export const wsService = new WorkspaceWebSocketService();
