/**
 * ExecutionLogsPanel Component
 *
 * Displays robot execution logs with step details.
 * Left side: Log entries list (newest first)
 * Right side: Selected log details (package, variables, input, output, error)
 */

import React, { useMemo } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Badge,
  Code,
} from "@chakra-ui/react";
import { FiCheck, FiX, FiClock, FiMinus } from "react-icons/fi";
import { RobotLogEntry } from "@/contexts/RobotTrackingContext";
import { StepStatus } from "@/hooks/useRobotTrackingSocket";

interface ExecutionLogsPanelProps {
  logs: RobotLogEntry[];
  selectedLog: RobotLogEntry | null;
  onSelectLog: (log: RobotLogEntry) => void;
  modelerRef?: any;  // BPMN modeler reference for node navigation
}

const STATUS_COLORS: Record<StepStatus, string> = {
  RUNNING: "orange",
  PASS: "green",
  ERROR: "red",
  FAIL: "red",
  SKIP: "gray",
};

const STATUS_ICONS: Record<StepStatus, React.ReactElement> = {
  RUNNING: <FiClock />,
  PASS: <FiCheck />,
  ERROR: <FiX />,
  FAIL: <FiX />,
  SKIP: <FiMinus />,
};

export default function ExecutionLogsPanel({
  logs,
  selectedLog,
  onSelectLog,
  modelerRef,
}: ExecutionLogsPanelProps) {
  // Display logs in reverse order (newest first)
  const reversedLogs = useMemo(() => [...logs].reverse(), [logs]);

  // Get variables from selected log
  const variables = selectedLog?.variables || [];

  // Format args as input display
  const inputDisplay = useMemo(() => {
    if (!selectedLog?.args || selectedLog.args.length === 0) {
      return null;
    }
    return JSON.stringify(selectedLog.args, null, 2);
  }, [selectedLog]);

  const handleProblemClick = (nodeID: string) => {
    if (!modelerRef?.bpmnModeler || !nodeID) return;

    try {
      const elementRegistry = modelerRef.bpmnModeler.get("elementRegistry");
      const eventBus = modelerRef.bpmnModeler.get("eventBus");

      // Get element by ID
      const element = elementRegistry.get(nodeID);
      if (!element) {
        console.warn(`Element with ID "${nodeID}" not found`);
        return;
      }

      // Trigger element.click event so CustomModeler can listen to it
      eventBus.fire("element.click", {
        element: element,
        originalEvent: new MouseEvent("click"),
      });
    } catch (error) {
      console.error("Error selecting element:", error);
    }
  };
  return (
    <Flex h="100%" overflow="hidden">
      {/* Left Panel - Logs List */}
      <Box
        w="40%"
        borderRight="1px solid"
        borderColor="gray.200"
        overflowY="auto"
        bg="white"
      >
        {logs.length === 0 ? (
          <Box p={4}>
            <Text color="gray.500" fontSize="sm">
              No logs available. Run the process to see execution logs.
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" spacing={0}>
            {reversedLogs.map((log) => (
              <HStack
                key={log.id}
                px={3}
                py={2}
                cursor="pointer"
                bg={selectedLog?.id === log.id ? "blue.50" : "transparent"}
                borderLeft="3px solid"
                borderColor={
                  selectedLog?.id === log.id
                    ? "blue.500"
                    : log.status === "ERROR" || log.status === "FAIL"
                    ? "red.400"
                    : "transparent"
                }
                _hover={{ bg: selectedLog?.id === log.id ? "blue.50" : "gray.50" }}
                onClick={() => {
                  onSelectLog(log);
                  // Navigate to the BPMN node if available
                  if (log.bpmnNodeId) {
                    handleProblemClick(log.bpmnNodeId);
                  }
                }}
                spacing={3}
              >
                {/* Status Icon */}
                <Box
                  color={
                    log.status === "ERROR" || log.status === "FAIL"
                      ? "red.500"
                      : log.status === "RUNNING"
                      ? "orange.500"
                      : log.status === "PASS"
                      ? "green.500"
                      : "gray.500"
                  }
                >
                  {log.status === "ERROR" || log.status === "FAIL" ? (
                    <Box
                      w={4}
                      h={4}
                      borderRadius="full"
                      bg="red.500"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="xs" color="white" fontWeight="bold">
                        !
                      </Text>
                    </Box>
                  ) :  (
                    <Box
                      w={4}
                      h={4}
                      borderRadius="full"
                      bg="green.500"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <FiCheck size={10} color="white" />
                    </Box>
                  )}
                </Box>

                {/* Timestamp */}
                <Text fontSize="xs" color="gray.500" fontFamily="mono" minW="60px">
                  {log.timestamp}
                </Text>

                {/* Step Name */}
                <Text
                  fontSize="sm"
                  color={
                    log.status === "ERROR" || log.status === "FAIL"
                      ? "red.600"
                      : "gray.700"
                  }
                  fontWeight={selectedLog?.id === log.id ? "medium" : "normal"}
                  noOfLines={1}
                  flex={1}
                >
                  {log.stepName}
                </Text>

                {/* Duration */}
                {log.durationMs !== undefined && (
                  <Text fontSize="xs" color="gray.400">
                    {log.durationMs}ms
                  </Text>
                )}
              </HStack>
            ))}
          </VStack>
        )}
      </Box>

      {/* Right Panel - Log Details */}
      <Box flex={1} overflowY="auto" bg="white" px={4} py={2}>
        {!selectedLog ? (
          <Flex h="100%" align="center" justify="center">
            <Text color="gray.400" fontSize="sm">
              Select a log entry to view details
            </Text>
          </Flex>
        ) : (
          <VStack align="stretch" spacing={2}>
            {/* Header */}
            <Box>
              <Text fontWeight="semibold" fontSize="sm" color="gray.700" mb={2}>
                Information
              </Text>
            </Box>

            {/* Package - Activity */}
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                Package - Activity
              </Text>
              <Badge
                colorScheme="gray"
                variant="subtle"
                px={3}
                py={1}
                borderRadius="md"
                fontSize="xs"
              >
                {selectedLog.packageActivity || selectedLog.stepName}
              </Badge>
            </Box>

            {/* Variables Section */}
            {variables.length > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={2}>
                  Variables
                </Text>
                <Box
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  overflow="hidden"
                >
                  {/* Header Row */}
                  <HStack
                    px={3}
                    py={1}
                    bg="gray.50"
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    fontSize="xs"
                    color="gray.500"
                  >
                    <Text flex={1}>Name</Text>
                    <Text flex={2}>Value</Text>
                  </HStack>

                  {/* Variable Rows - Read Only */}
                  {variables.map((variable, index) => (
                    <HStack
                      key={index}
                      px={3}
                      py={2}
                      borderBottom={
                        index < variables.length - 1 ? "1px solid" : "none"
                      }
                      borderColor="gray.100"
                    >
                      <Box flex={1}>
                        <Badge
                          colorScheme="purple"
                          variant="subtle"
                          fontSize="xs"
                          fontWeight="normal"
                        >
                          ${variable.name}
                        </Badge>
                      </Box>
                      <Box flex={2}>
                        <Text
                          fontSize="xs"
                          color="gray.700"
                          bg="gray.50"
                          px={2}
                          py={1}
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                        >
                          {variable.value}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </Box>
              </Box>
            )}

            {/* Arguments / Input Section */}
            {inputDisplay && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Arguments
                </Text>
                <Code
                  display="block"
                  p={3}
                  borderRadius="md"
                  bg="gray.100"
                  fontSize="xs"
                  whiteSpace="pre-wrap"
                  maxH="100px"
                  overflowY="auto"
                >
                  {inputDisplay}
                </Code>
              </Box>
            )}

            {/* Error (if any) */}
            {(selectedLog.status === "ERROR" || selectedLog.status === "FAIL") && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Error
                </Text>
                <Code
                  display="block"
                  p={3}
                  borderRadius="md"
                  bg="red.50"
                  color="red.700"
                  fontSize="xs"
                  whiteSpace="pre-wrap"
                  border="1px solid"
                  borderColor="red.200"
                >
                  {selectedLog.error
                    ? `{"message": "${selectedLog.error}"}`
                    : '{"message": "Step execution failed"}'}
                </Code>
              </Box>
            )}

            {/* Duration */}
            {selectedLog.durationMs !== undefined && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Duration
                </Text>
                <Badge colorScheme="blue" variant="subtle">
                  {selectedLog.durationMs}ms
                </Badge>
              </Box>
            )}
          </VStack>
        )}
      </Box>
    </Flex>
  );
}
