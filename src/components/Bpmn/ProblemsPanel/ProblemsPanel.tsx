import React from "react";
import { Box, Flex, Text, VStack, Divider } from "@chakra-ui/react";
import { WarningIcon, CloseIcon } from "@chakra-ui/icons";

export interface Problem {
  id: string;
  type: "error" | "warning";
  nodeName: string;
  content: string | React.ReactNode;
}

interface ProblemsPanelProps {
  problems?: Problem[];
  modelerRef?: any;
}

export default function ProblemsPanel({ problems = [], modelerRef }: ProblemsPanelProps) {
  const errorCount = problems.filter((p) => p.type === "error").length;

  const handleProblemClick = (activityID: string) => {
    if (!modelerRef?.bpmnModeler || !activityID) return;

    try {
      const elementRegistry = modelerRef.bpmnModeler.get("elementRegistry");
      const eventBus = modelerRef.bpmnModeler.get("eventBus");

      // Get element by ID
      const element = elementRegistry.get(activityID);
      if (!element) {
        console.warn(`Element with ID "${activityID}" not found`);
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

  if (problems.length === 0) {
    return (
      <Box p={4}>
        <Text color="gray.500" fontSize="sm">
          No problems detected in the BPMN diagram.
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={0} align="stretch">
      {problems.map((problem, index) => (
        <React.Fragment key={problem.id}>
          <Flex
            px={4}
            py={2}
            align="flex-start"
            gap={3}
            _hover={{ bg: "gray.50" }}
            cursor="pointer"
            onClick={() => handleProblemClick(problem.nodeName)}
          >
            {/* Left side: Icon + Node Name */}
            <Flex align="center" gap={2} minW="200px" flexShrink={0}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="18px"
                h="18px"
                borderRadius="full"
                bg={problem.type === "error" ? "red.500" : "orange.500"}
                flexShrink={0}
              >
                {problem.type === "error" ? (
                  <CloseIcon w="10px" h="10px" color="white" />
                ) : (
                  <WarningIcon w="12px" h="12px" color="white" />
                )}
              </Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.900">
                {problem.nodeName}
              </Text>
            </Flex>

            {/* Right side: Content */}
            <Box flex={1}>
              {typeof problem.content === "string" ? (
                <Text fontSize="sm" color="gray.700">
                  {problem.content}
                </Text>
              ) : (
                problem.content
              )}
            </Box>
          </Flex>
          {index < problems.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </VStack>
  );
}

// Export helper function to get error count
export function getErrorCount(problems: Problem[]): number {
  return problems.filter((p) => p.type === "error").length;
}
