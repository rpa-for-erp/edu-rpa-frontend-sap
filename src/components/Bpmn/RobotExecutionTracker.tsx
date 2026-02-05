/**
 * RobotExecutionTracker Component
 *
 * Real-time visualization of robot execution on BPMN canvas.
 * Shows step-by-step progress with smooth animations and status indicators.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Tooltip,
  useToast,
  Collapse,
  Divider,
  Progress,
  Button,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiPause,
  FiSkipForward,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiX,
  FiMinus,
  FiClock,
} from 'react-icons/fi';
import { useRobotTrackingSocket, ExecutedStep, StepStatus } from '@/hooks/useRobotTrackingSocket';
import { BpmnExecutionHighlighter } from '@/services/bpmnExecutionHighlighter';

interface RobotExecutionTrackerProps {
  processId: string;
  modeler: any; // BPMN modeler instance
  isEnabled?: boolean;
  onClose?: () => void;
}

const STATUS_COLORS: Record<StepStatus, string> = {
  RUNNING: 'orange',
  PASS: 'green',
  ERROR: 'red',
  FAIL: 'red',
  SKIP: 'gray',
};

const STATUS_ICONS: Record<StepStatus, React.ReactNode> = {
  RUNNING: <FiClock />,
  PASS: <FiCheck />,
  ERROR: <FiX />,
  FAIL: <FiX />,
  SKIP: <FiMinus />,
};

export const RobotExecutionTracker: React.FC<RobotExecutionTrackerProps> = ({
  processId,
  modeler,
  isEnabled = true,
  onClose,
}) => {
  const toast = useToast();
  const highlighterRef = useRef<BpmnExecutionHighlighter | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isPanelVisible, setIsPanelVisible] = React.useState(false);
  const previousStepRef = useRef<ExecutedStep | null>(null);

  // Handle step start - highlight with running animation
  const handleStepStart = useCallback((step: ExecutedStep) => {
    console.log('[Tracker] Step started:', step);
    
    if (highlighterRef.current) {
      highlighterRef.current.highlightNode(step.bpmnNodeId, 'RUNNING');
      highlighterRef.current.centerOnNode(step.bpmnNodeId);

      // Animate sequence flow from previous step
      if (previousStepRef.current) {
        highlighterRef.current.animateSequenceFlow(
          previousStepRef.current.bpmnNodeId,
          step.bpmnNodeId
        );
      }
    }

    toast({
      title: `▶️ Running: ${step.stepId}`,
      status: 'info',
      duration: 2000,
      isClosable: true,
      position: 'bottom-right',
    });
  }, [toast]);

  // Handle step end - update highlight with final status
  const handleStepEnd = useCallback((step: ExecutedStep) => {
    console.log('[Tracker] Step ended:', step);
    
    if (highlighterRef.current) {
      highlighterRef.current.highlightNode(step.bpmnNodeId, step.status);
    }

    previousStepRef.current = step;

    const statusEmoji = step.status === 'PASS' ? '✅' : step.status === 'ERROR' ? '❌' : '⏭️';
    toast({
      title: `${statusEmoji} ${step.stepId}: ${step.status}`,
      description: step.durationMs ? `Duration: ${step.durationMs}ms` : undefined,
      status: step.status === 'PASS' ? 'success' : step.status === 'ERROR' ? 'error' : 'warning',
      duration: 2000,
      isClosable: true,
      position: 'bottom-right',
    });
  }, [toast]);

  // Handle run end
  const handleRunEnd = useCallback((status: StepStatus) => {
    console.log('[Tracker] Run ended:', status);
    
    previousStepRef.current = null;

    toast({
      title: status === 'PASS' ? '🎉 Robot completed successfully!' : '⚠️ Robot finished with errors',
      status: status === 'PASS' ? 'success' : 'error',
      duration: 5000,
      isClosable: true,
      position: 'top',
    });
  }, [toast]);

  // Initialize WebSocket connection
  const {
    trackingState,
    connect,
    disconnect,
    continueStep,
    resetTracking,
  } = useRobotTrackingSocket({
    processId,
    onStepStart: handleStepStart,
    onStepEnd: handleStepEnd,
    onRunEnd: handleRunEnd,
    autoConnect: false,
  });

  // Initialize highlighter when modeler is ready
  useEffect(() => {
    if (modeler && isEnabled) {
      highlighterRef.current = new BpmnExecutionHighlighter(modeler);
      console.log('[Tracker] Highlighter initialized');
    }

    return () => {
      if (highlighterRef.current) {
        highlighterRef.current.clearAllHighlights();
        highlighterRef.current = null;
      }
    };
  }, [modeler, isEnabled]);

  // Inject global styles
  useEffect(() => {
    const styleId = 'bpmn-execution-highlighter-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = BpmnExecutionHighlighter.getGlobalStyles();
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);

  // Handle connect/disconnect
  const handleToggleConnection = () => {
    if (trackingState.isConnected) {
      disconnect();
      setIsPanelVisible(false);
    } else {
      connect();
      setIsPanelVisible(true);
    }
  };

  // Handle reset
  const handleReset = () => {
    resetTracking();
    if (highlighterRef.current) {
      highlighterRef.current.clearAllHighlights();
    }
    previousStepRef.current = null;
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* Floating toggle button */}
      <Box
        position="fixed"
        bottom="20px"
        right="20px"
        zIndex={1000}
      >
        <Tooltip label={trackingState.isConnected ? 'Disconnect from robot' : 'Connect to robot'}>
          <IconButton
            aria-label="Toggle robot tracking"
            icon={trackingState.isConnected ? <FiWifi /> : <FiWifiOff />}
            colorScheme={trackingState.isConnected ? 'green' : 'gray'}
            size="lg"
            borderRadius="full"
            boxShadow="lg"
            onClick={handleToggleConnection}
            _hover={{
              transform: 'scale(1.1)',
            }}
            transition="all 0.2s"
          />
        </Tooltip>
      </Box>

      {/* Tracking panel */}
      <Collapse in={isPanelVisible} animateOpacity>
        <Box
          position="fixed"
          bottom="80px"
          right="20px"
          width="320px"
          maxHeight="400px"
          bg="white"
          borderRadius="xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor="gray.200"
          overflow="hidden"
          zIndex={999}
        >
          {/* Header */}
          <HStack
            px={4}
            py={3}
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            color="white"
            justifyContent="space-between"
          >
            <HStack>
              <Box
                w={2}
                h={2}
                borderRadius="full"
                bg={trackingState.isConnected ? 'green.300' : 'red.300'}
                animation={trackingState.isConnected && trackingState.isRunning ? 'pulse 1s infinite' : undefined}
              />
              <Text fontWeight="bold" fontSize="sm">
                🤖 Robot Execution
              </Text>
            </HStack>
            <HStack>
              <IconButton
                aria-label="Reset"
                icon={<FiRefreshCw />}
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={handleReset}
              />
              <IconButton
                aria-label="Toggle panel"
                icon={isExpanded ? <FiChevronDown /> : <FiChevronUp />}
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setIsExpanded(!isExpanded)}
              />
            </HStack>
          </HStack>

          {/* Content */}
          <Collapse in={isExpanded}>
            <VStack align="stretch" p={4} spacing={3}>
              {/* Connection status */}
              <HStack justifyContent="space-between">
                <Text fontSize="xs" color="gray.500">
                  Status
                </Text>
                <Badge
                  colorScheme={
                    trackingState.isRunning
                      ? 'orange'
                      : trackingState.isConnected
                      ? 'green'
                      : 'gray'
                  }
                  variant="subtle"
                  px={2}
                  borderRadius="full"
                >
                  {trackingState.isRunning
                    ? '🏃 Running'
                    : trackingState.isConnected
                    ? '🟢 Connected'
                    : '⚫ Disconnected'}
                </Badge>
              </HStack>

              {/* Run status if completed */}
              {trackingState.runStatus && (
                <HStack justifyContent="space-between">
                  <Text fontSize="xs" color="gray.500">
                    Last Run
                  </Text>
                  <Badge
                    colorScheme={STATUS_COLORS[trackingState.runStatus]}
                    variant="solid"
                    px={2}
                    borderRadius="full"
                  >
                    {trackingState.runStatus}
                  </Badge>
                </HStack>
              )}

              {/* Current step */}
              {trackingState.currentStep && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Current Step
                    </Text>
                    <HStack
                      p={2}
                      bg="orange.50"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="orange.200"
                    >
                      <Box color="orange.500" animation="spin 1s linear infinite">
                        <FiClock />
                      </Box>
                      <Text fontSize="sm" fontWeight="medium" color="orange.700" noOfLines={1}>
                        {trackingState.currentStep.stepId}
                      </Text>
                    </HStack>
                  </Box>
                </>
              )}

              {/* Continue button for step mode */}
              {trackingState.currentStep && (
                <Button
                  leftIcon={<FiSkipForward />}
                  colorScheme="blue"
                  size="sm"
                  onClick={continueStep}
                  width="100%"
                >
                  Continue to Next Step
                </Button>
              )}

              {/* Executed steps list */}
              {trackingState.executedSteps.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <HStack justifyContent="space-between" mb={2}>
                      <Text fontSize="xs" color="gray.500">
                        Executed Steps
                      </Text>
                      <Badge variant="outline" colorScheme="gray" fontSize="xs">
                        {trackingState.executedSteps.length}
                      </Badge>
                    </HStack>
                    <VStack
                      align="stretch"
                      spacing={1}
                      maxHeight="150px"
                      overflowY="auto"
                      css={{
                        '&::-webkit-scrollbar': {
                          width: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f1f1f1',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#888',
                          borderRadius: '4px',
                        },
                      }}
                    >
                      {trackingState.executedSteps.map((step, index) => (
                        <HStack
                          key={`${step.stepId}-${index}`}
                          p={2}
                          bg={`${STATUS_COLORS[step.status]}.50`}
                          borderRadius="md"
                          border="1px solid"
                          borderColor={`${STATUS_COLORS[step.status]}.200`}
                          spacing={2}
                        >
                          <Box color={`${STATUS_COLORS[step.status]}.500`}>
                            {STATUS_ICONS[step.status]}
                          </Box>
                          <Text
                            fontSize="xs"
                            flex={1}
                            noOfLines={1}
                            color={`${STATUS_COLORS[step.status]}.700`}
                          >
                            {step.stepId}
                          </Text>
                          {step.durationMs && (
                            <Text fontSize="xs" color="gray.500">
                              {step.durationMs}ms
                            </Text>
                          )}
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </>
              )}

              {/* Progress bar for running */}
              {trackingState.isRunning && (
                <Progress
                  size="xs"
                  isIndeterminate
                  colorScheme="blue"
                  borderRadius="full"
                />
              )}
            </VStack>
          </Collapse>
        </Box>
      </Collapse>

      {/* Global animation styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default RobotExecutionTracker;
