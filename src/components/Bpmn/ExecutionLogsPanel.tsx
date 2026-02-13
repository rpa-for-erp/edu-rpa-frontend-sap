/**
 * ExecutionLogsPanel Component
 *
 * Displays robot execution logs with step details.
 * Left side: Log entries list (newest first)
 * Right side: Selected log details (package, variables, input, output, error)
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Badge,
  Code,
  Input,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { FiCheck, FiX, FiClock, FiMinus } from "react-icons/fi";
import { RobotLogEntry } from "@/contexts/RobotTrackingContext";
import { StepStatus } from "@/hooks/useRobotTrackingSocket";
import {
  getVariableItemFromLocalStorage,
  replaceVariableStorage,
  convertToRefactoredObject,
} from "@/utils/variableService";
import { setLocalStorageObject } from "@/utils/localStorageService";
import { LocalStorage } from "@/constants/localStorage";
import {
  getProcessFromLocalStorage,
  updateProcessInProcessList,
} from "@/utils/processService";

interface ExecutionLogsPanelProps {
  logs: RobotLogEntry[];
  selectedLog: RobotLogEntry | null;
  onSelectLog: (log: RobotLogEntry) => void;
  modelerRef?: any; // BPMN modeler reference for node navigation
  processID: string; // Process ID for updating variable storage
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
  processID,
}: ExecutionLogsPanelProps) {
  // Display logs in reverse order (newest first)
  const reversedLogs = useMemo(() => [...logs].reverse(), [logs]);

  // Track edited variable values locally so the UI reflects changes immediately
  // Key: variable name, Value: new value
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  // Get variables from selected log, with local edits applied
  const variables = useMemo(() => {
    const raw = selectedLog?.variables || [];
    return raw.map((v) =>
      editedValues[v.name] !== undefined
        ? { ...v, value: editedValues[v.name] }
        : v,
    );
  }, [selectedLog, editedValues]);

  // Track which variable is being edited and its draft value
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Format args as input display
  const inputDisplay = useMemo(() => {
    if (!selectedLog?.args || selectedLog.args.length === 0) {
      return null;
    }
    return JSON.stringify(selectedLog.args, null, 2);
  }, [selectedLog]);

  // Start editing a variable
  const handleStartEdit = useCallback(
    (varName: string, currentValue: string) => {
      setEditingVar(varName);
      setEditValue(currentValue);
    },
    [],
  );

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingVar(null);
    setEditValue("");
  }, []);

  // Confirm edit: update variable value in localStorage
  const handleConfirmEdit = useCallback(
    (varName: string) => {
      const variableItem = getVariableItemFromLocalStorage(processID);
      if (!variableItem) {
        setEditingVar(null);
        return;
      }

      // Find and update the variable by name
      const updatedVariables = variableItem.variables.map((v: any) =>
        v.name === varName ? { ...v, value: editValue } : v,
      );

      const updatedItem = {
        ...variableItem,
        variables: updatedVariables,
      };

      // Save to VARIABLE_LIST in localStorage
      const newStorage = replaceVariableStorage(processID, updatedItem);
      setLocalStorageObject(LocalStorage.VARIABLE_LIST, newStorage);

      // Also update PROCESS_LIST storage
      const processProperties = getProcessFromLocalStorage(processID);
      if (processProperties) {
        const refactoredVariables = convertToRefactoredObject(updatedItem);
        const updateStorageByID = {
          ...processProperties,
          variables: refactoredVariables,
        };
        const replaceStorageSnapshot = updateProcessInProcessList(
          processID,
          updateStorageByID,
        );
        setLocalStorageObject(
          LocalStorage.PROCESS_LIST,
          replaceStorageSnapshot,
        );
      }

      // Dispatch event so VariablesPanel stays in sync
      window.dispatchEvent(
        new CustomEvent("variables-updated", {
          detail: { processID },
        }),
      );

      // Update local edited values so the log UI reflects the change immediately
      setEditedValues((prev) => ({ ...prev, [varName]: editValue }));

      setEditingVar(null);
      setEditValue("");
    },
    [processID, editValue],
  );

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
                _hover={{
                  bg: selectedLog?.id === log.id ? "blue.50" : "gray.50",
                }}
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
                  ) : (
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
                <Text
                  fontSize="xs"
                  color="gray.500"
                  fontFamily="mono"
                  minW="60px"
                >
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

                  {/* Variable Rows - Editable */}
                  {variables.map((variable, index) => {
                    const isEditing = editingVar === variable.name;
                    return (
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
                          {isEditing ? (
                            <HStack spacing={1}>
                              <Input
                                size="xs"
                                fontSize="xs"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleConfirmEdit(variable.name);
                                  } else if (e.key === "Escape") {
                                    handleCancelEdit();
                                  }
                                }}
                                autoFocus
                                borderColor="teal.300"
                                _focus={{
                                  borderColor: "teal.500",
                                  boxShadow:
                                    "0 0 0 1px var(--chakra-colors-teal-500)",
                                }}
                                borderRadius="md"
                                px={2}
                                py={1}
                              />
                              <Tooltip label="Confirm" fontSize="xs">
                                <IconButton
                                  aria-label="Confirm edit"
                                  icon={<FiCheck />}
                                  size="xs"
                                  colorScheme="teal"
                                  variant="ghost"
                                  onClick={() =>
                                    handleConfirmEdit(variable.name)
                                  }
                                />
                              </Tooltip>
                              <Tooltip label="Cancel" fontSize="xs">
                                <IconButton
                                  aria-label="Cancel edit"
                                  icon={<FiX />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                />
                              </Tooltip>
                            </HStack>
                          ) : (
                            <Text
                              fontSize="xs"
                              color="gray.700"
                              bg="gray.50"
                              px={2}
                              py={1}
                              borderRadius="md"
                              border="1px solid"
                              borderColor="gray.200"
                              cursor="pointer"
                              _hover={{
                                borderColor: "teal.300",
                                bg: "teal.50",
                              }}
                              onClick={() =>
                                handleStartEdit(variable.name, variable.value)
                              }
                              title="Click to edit"
                            >
                              {variable.value}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                    );
                  })}
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
            {/* Message / Error */}
            {(selectedLog.message || selectedLog.error) &&
              (() => {
                const isError =
                  selectedLog.status === "ERROR" ||
                  selectedLog.status === "FAIL";
                const label = isError ? "Error" : "Message";
                const content = isError
                  ? selectedLog.error ||
                    selectedLog.message ||
                    "Step execution failed"
                  : selectedLog.message;
                return (
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      {label}
                    </Text>
                    <Code
                      display="block"
                      p={3}
                      borderRadius="md"
                      bg={isError ? "red.50" : "green.50"}
                      color={isError ? "red.700" : "green.700"}
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                      border="1px solid"
                      borderColor={isError ? "red.200" : "green.200"}
                      maxH="100px"
                      overflowY="auto"
                    >
                      {content}
                    </Code>
                  </Box>
                );
              })()}

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
