/**
 * RobotTrackingContext
 *
 * Shared context for robot execution tracking state.
 * Allows multiple components to access and control robot tracking.
 */

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useRobotTrackingSocket, RobotTrackingState, ExecutedStep, StepStatus, RobotEventData } from '@/hooks/useRobotTrackingSocket';
import { getProcessFromLocalStorage } from '@/utils/processService';

export type SimulationMode = 'step-by-step' | 'run-all';

export interface RobotLogEntry {
  id: string;
  timestamp: string;
  stepName: string;
  status: StepStatus;
  bpmnNodeId?: string;  // BPMN node ID for navigation
  packageActivity?: string;
  variables?: { name: string; value: string }[];
  args?: string[];
  input?: string;
  output?: string;
  error?: string;
  message?: string;    // Step message (shown for all statuses)
  durationMs?: number;
}

interface RobotTrackingContextValue {
  // State
  trackingState: RobotTrackingState;
  simulationMode: SimulationMode;
  logs: RobotLogEntry[];
  selectedLog: RobotLogEntry | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  continueStep: () => void;
  resetTracking: () => void;
  setSimulationMode: (mode: SimulationMode) => void;
  selectLog: (log: RobotLogEntry | null) => void;
  startRobot: () => void;
  stopRobot: () => void;
}

const RobotTrackingContext = createContext<RobotTrackingContextValue | null>(null);

interface RobotTrackingProviderProps {
  processId: string;
  modeler: any;
  children: ReactNode;
  onStepStart?: (step: ExecutedStep) => void;
  onStepEnd?: (step: ExecutedStep) => void;
  onRunEnd?: (status: StepStatus) => void;
}

export function RobotTrackingProvider({
  processId,
  modeler,
  children,
  onStepStart,
  onStepEnd,
  onRunEnd,
}: RobotTrackingProviderProps) {
  const [simulationMode, setSimulationMode] = React.useState<SimulationMode>('step-by-step');
  const [logs, setLogs] = React.useState<RobotLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = React.useState<RobotLogEntry | null>(null);
  const logIdCounter = React.useRef(0);

  // Get activities from localStorage for keyword mapping
  const activities = useMemo(() => {
    const process = getProcessFromLocalStorage(processId);
    return process?.activities || [];
  }, [processId]);

  // Handle step start - add to logs
  const handleStepStart = useCallback((step: ExecutedStep) => {
    const newLog: RobotLogEntry = {
      id: `log-${++logIdCounter.current}`,
      timestamp: new Date(step.startTime).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      stepName: step.stepId,
      status: 'RUNNING',
      packageActivity: step.stepId,
    };
    
    setLogs(prev => [...prev, newLog]);
    onStepStart?.(step);
  }, [onStepStart]);

  // Handle step end - update log entry
  const handleStepEnd = useCallback((step: ExecutedStep) => {
    setLogs(prev => prev.map(log => 
      log.stepName === step.stepId && log.status === 'RUNNING'
        ? {
            ...log,
            status: step.status,
            durationMs: step.durationMs,
            message: step.message || undefined,
            error: step.status === 'ERROR' || step.status === 'FAIL' 
              ? step.message || 'Step execution failed'
              : undefined,
          }
        : log
    ));
    onStepEnd?.(step);
  }, [onStepEnd]);

  // Handle run end
  const handleRunEnd = useCallback((status: StepStatus) => {
    onRunEnd?.(status);
  }, [onRunEnd]);

  // Initialize WebSocket connection
  const {
    trackingState,
    connect,
    disconnect,
    continueStep,
    resetTracking: resetTrackingState,
  } = useRobotTrackingSocket({
    processId,
    activities,
    onStepStart: handleStepStart,
    onStepEnd: handleStepEnd,
    onRunEnd: handleRunEnd,
    autoConnect: false,
  });

  // Reset tracking with logs
  const resetTracking = useCallback(() => {
    resetTrackingState();
    setLogs([]);
    setSelectedLog(null);
  }, [resetTrackingState]);

  // Select a log entry
  const selectLog = useCallback((log: RobotLogEntry | null) => {
    setSelectedLog(log);
  }, []);

  // Start robot execution
  const startRobot = useCallback(() => {
    if (!trackingState.isConnected) {
      connect();
    }
    // In real implementation, this would trigger robot execution on backend
    console.log('[RobotTracking] Start robot in mode:', simulationMode);
  }, [connect, trackingState.isConnected, simulationMode]);

  // Stop robot execution
  const stopRobot = useCallback(() => {
    console.log('[RobotTracking] Stop robot');
    // In real implementation, this would stop robot execution on backend
  }, []);

  const value: RobotTrackingContextValue = {
    trackingState,
    simulationMode,
    logs,
    selectedLog,
    connect,
    disconnect,
    continueStep,
    resetTracking,
    setSimulationMode,
    selectLog,
    startRobot,
    stopRobot,
  };

  return (
    <RobotTrackingContext.Provider value={value}>
      {children}
    </RobotTrackingContext.Provider>
  );
}

export function useRobotTracking() {
  const context = useContext(RobotTrackingContext);
  if (!context) {
    throw new Error('useRobotTracking must be used within a RobotTrackingProvider');
  }
  return context;
}

export default RobotTrackingContext;
