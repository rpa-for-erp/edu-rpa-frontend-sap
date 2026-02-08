/**
 * useRobotTrackingSocket Hook
 *
 * Manages WebSocket connection for real-time robot execution tracking.
 * Handles joining/leaving process rooms and listening for robot events.
 * 
 * BE Gateway: /robot-report-logs-realtime namespace
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getLocalStorageObject } from '@/utils/localStorageService';
import { LocalStorage } from '@/constants/localStorage';

// Robot event types from listener
export type RobotEventType =
  | 'RUN_START'
  | 'RUN_END'
  | 'TEST_START'
  | 'TEST_END'
  | 'STEP_START'
  | 'STEP_END'
  | 'STEP_LOG';

export type StepStatus = 'PASS' | 'ERROR' | 'FAIL' | 'SKIP' | 'RUNNING';

export interface RobotStep {
  id: string;
  name: string;
}

export interface RobotEventData {
  seq: number;
  ts: string;
  type: RobotEventType;
  processId: string;
  step?: RobotStep;
  suite?: { name: string };
  test?: { name: string; tags?: string[] };
  status?: StepStatus;
  data?: {
    lib?: string;
    args?: string[];
    durationMs?: number;
    message?: string;
    level?: string;
  };
}

export interface ExecutedStep {
  stepId: string;      // Keyword name (e.g., "Create Drive Directory")
  bpmnNodeId: string;  // BPMN node ID for highlighting
  status: StepStatus;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  message?: string;
  args?: string[];     // Arguments from robot execution
}

export interface RobotTrackingState {
  isConnected: boolean;
  isJoined: boolean;
  isRunning: boolean;
  waitingForContinue: boolean; // True when paused in step-by-step mode, waiting for continueStep
  currentStep?: ExecutedStep;
  lastCompletedStep?: ExecutedStep; // Last step that finished, for display purposes
  executedSteps: ExecutedStep[];
  runStatus?: StepStatus;
  error?: string;
}

interface UseRobotTrackingSocketOptions {
  processId: string;
  onStepStart?: (step: ExecutedStep) => void;
  onStepEnd?: (step: ExecutedStep) => void;
  onRunEnd?: (status: StepStatus) => void;
  autoConnect?: boolean;
}

interface UseRobotTrackingSocketReturn {
  trackingState: RobotTrackingState;
  connect: () => void;
  disconnect: () => void;
  joinRoom: () => void;
  leaveRoom: () => void;
  continueStep: () => void;
  resetTracking: () => void;
}

// BE WebSocket path for robot report logs
const WS_BASE_URL = process.env.NEXT_PUBLIC_DEV_API || 'http://localhost:8080';
const SOCKET_PATH = '/robot-report-logs-realtime';

export function useRobotTrackingSocket({
  processId,
  onStepStart,
  onStepEnd,
  onRunEnd,
  autoConnect = false,
}: UseRobotTrackingSocketOptions): UseRobotTrackingSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [trackingState, setTrackingState] = useState<RobotTrackingState>({
    isConnected: false,
    isJoined: false,
    isRunning: false,
    waitingForContinue: false,
    executedSteps: [],
  });

  // Callbacks refs
  const onStepStartRef = useRef(onStepStart);
  const onStepEndRef = useRef(onStepEnd);
  const onRunEndRef = useRef(onRunEnd);

  useEffect(() => {
    onStepStartRef.current = onStepStart;
    onStepEndRef.current = onStepEnd;
    onRunEndRef.current = onRunEnd;
  }, [onStepStart, onStepEnd, onRunEnd]);

  /**
   * Find BPMN node ID by keyword name
   * Reads activities from localStorage
   */
  const findBpmnNodeByKeyword = useCallback((keyword: string): string | null => {
    let currentActivities: Array<{ activityID: string; keyword?: string }> = [];
    
    // Get activities from localStorage
    try {
      const processList = getLocalStorageObject(LocalStorage.PROCESS_LIST);
      if (processList && Array.isArray(processList)) {
        const currentProcess = processList.find(
          (p: any) => p.processID === processId || p.id === processId
        );
        if (currentProcess?.activities) {
          currentActivities = currentProcess.activities;
        }
      }
    } catch (error) {
      console.error('[RobotTracking] Failed to load activities from localStorage:', error);
    }

    if (currentActivities.length === 0) {
      console.warn('[RobotTracking] No activities available to find BPMN node for keyword:', keyword);
      return null;
    }

    // Find activity by keyword
    const activity = currentActivities.find(
      (a) => a.keyword === keyword
    );
    
    if (activity) {
      console.log('[RobotTracking] Found BPMN node:', activity.activityID, 'for keyword:', keyword);
    } else {
      console.warn('[RobotTracking] No activity found for keyword:', keyword, 
        'Available keywords:', currentActivities.map((a: any) => a.keyword).filter(Boolean));
    }
    
    return activity?.activityID || null;
  }, [processId]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[RobotTracking] Already connected');
      return;
    }

    const accessToken = getLocalStorageObject(LocalStorage.ACCESS_TOKEN);

    console.log('[RobotTracking] Connecting to:', WS_BASE_URL, 'path:', SOCKET_PATH);

    socketRef.current = io(WS_BASE_URL, {
      path: SOCKET_PATH,
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
      console.log('[RobotTracking] ✅ Connected');
      setTrackingState((prev) => ({ ...prev, isConnected: true, error: undefined }));
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[RobotTracking] ❌ Disconnected:', reason);
      setTrackingState((prev) => ({ ...prev, isConnected: false, isJoined: false }));
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[RobotTracking] Connection error:', error);
      setTrackingState((prev) => ({
        ...prev,
        isConnected: false,
        error: error.message,
      }));
    });

    // Robot events
    socketRef.current.on('robotEvent', (data: RobotEventData) => {
      console.log('[RobotTracking] 📥 Event received:', data.type, data);
      handleRobotEvent(data);
    });
  }, []);

  /**
   * Handle incoming robot events
   */
  const handleRobotEvent = useCallback((event: RobotEventData) => {
    switch (event.type) {
      case 'RUN_START':
        setTrackingState((prev) => ({
          ...prev,
          isRunning: true,
          executedSteps: [],
          runStatus: undefined,
          currentStep: undefined,
        }));
        break;

      case 'STEP_START':
        if (event.step) {
          const bpmnNodeId = findBpmnNodeByKeyword(event.step.id);
          if (bpmnNodeId) {
            const newStep: ExecutedStep = {
              stepId: event.step.id,
              bpmnNodeId,
              status: 'RUNNING',
              startTime: event.ts,
            };

            setTrackingState((prev) => ({
              ...prev,
              currentStep: newStep,
              waitingForContinue: false, // Robot is now executing, not waiting
            }));

            onStepStartRef.current?.(newStep);
          } else {
            console.warn('[RobotTracking] No BPMN node found for keyword:', event.step.id);
          }
        }
        break;

      case 'STEP_END':
        if (event.step) {
          const bpmnNodeId = findBpmnNodeByKeyword(event.step.id);
          if (bpmnNodeId) {
            const completedStep: ExecutedStep = {
              stepId: event.step.id,
              bpmnNodeId,
              status: event.status || 'PASS',
              startTime: event.ts,
              endTime: event.ts,
              durationMs: event.data?.durationMs,
              message: event.data?.message,
              args: event.data?.args,
            };

            setTrackingState((prev) => ({
              ...prev,
              currentStep: undefined,
              lastCompletedStep: completedStep,
              waitingForContinue: true, // Robot is now waiting for continueStep signal
              executedSteps: [...prev.executedSteps, completedStep],
            }));

            onStepEndRef.current?.(completedStep);
          }
        }
        break;

      case 'RUN_END':
        const runStatus = event.status || 'PASS';
        setTrackingState((prev) => ({
          ...prev,
          isRunning: false,
          waitingForContinue: false,
          runStatus,
          currentStep: undefined,
        }));
        onRunEndRef.current?.(runStatus);
        break;

      case 'STEP_LOG':
        // Log messages during step execution
        if (event.data?.level === 'FAIL') {
          console.error('[RobotTracking] Step failed:', event.data.message);
        }
        break;

      default:
        break;
    }
  }, [findBpmnNodeByKeyword]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setTrackingState({
        isConnected: false,
        isJoined: false,
        isRunning: false,
        waitingForContinue: false,
        executedSteps: [],
      });
    }
  }, []);

  /**
   * Join process room
   */
  const joinRoom = useCallback(() => {
    if (!socketRef.current?.connected) {
      console.warn('[RobotTracking] Cannot join room - not connected');
      return;
    }

    console.log('[RobotTracking] 📢 Joining room for process:', processId);
    socketRef.current.emit('joinProcess', { processId });
    setTrackingState((prev) => ({ ...prev, isJoined: true }));
  }, [processId]);

  /**
   * Leave process room
   */
  const leaveRoom = useCallback(() => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('leaveProcess', { processId });
    setTrackingState((prev) => ({ ...prev, isJoined: false }));
  }, [processId]);

  /**
   * Send continue step signal
   */
  const continueStep = useCallback(() => {
    if (!socketRef.current?.connected) {
      console.warn('[RobotTracking] Cannot continue - not connected');
      return;
    }

    console.log('[RobotTracking] ➡️ Sending continueStep');
    socketRef.current.emit('continueStep', { processId });
    
    // Reset waiting state - we've sent the continue signal
    setTrackingState((prev) => ({
      ...prev,
      waitingForContinue: false,
    }));
  }, [processId]);

  /**
   * Reset tracking state
   */
  const resetTracking = useCallback(() => {
    setTrackingState((prev) => ({
      ...prev,
      isRunning: false,
      waitingForContinue: false,
      currentStep: undefined,
      lastCompletedStep: undefined,
      executedSteps: [],
      runStatus: undefined,
    }));
  }, []);

  // Auto-connect if enabled
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
    if (trackingState.isConnected && !trackingState.isJoined && processId) {
      joinRoom();
    }
  }, [trackingState.isConnected, trackingState.isJoined, processId, joinRoom]);

  return {
    trackingState,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    continueStep,
    resetTracking,
  };
}

export default useRobotTrackingSocket;
