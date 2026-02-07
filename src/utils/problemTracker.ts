import { Process } from "@/types/process";
import { Activity } from "@/types/activity";
import { Problem } from "@/components/Bpmn/ProblemsPanel/ProblemsPanel";
import { getProcessFromLocalStorage } from "./processService";
import React from "react";
import { Text } from "@chakra-ui/react";

interface ActivityProperties {
  activityPackage?: string;
  activityName?: string;
  library?: string;
  arguments?: Record<
    string,
    {
      keywordArg?: string;
      overrideType?: string | null;
      value?: string | null;
    }
  >;
  return?: string | null;
}

interface ProcessVariables {
  [variableName: string]: {
    type: string;
    isArgument: boolean;
    defaultValue: string;
  };
}

/**
 * Extract variable name from value string
 * Example: "${name course}" -> "name course"
 */
function extractVariableName(value: string): string | null {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^\$\{([^}]+)\}$/);
  return match ? match[1] : null;
}

/**
 * Check if variable exists in variables object
 */
function variableExists(
  variableName: string,
  variables: ProcessVariables,
): boolean {
  return variableName in variables;
}

/**
 * Get display name for activity
 * Always return activityID as per requirement
 */
function getActivityDisplayName(activity: Activity): string {
  return activity.activityID;
}

/**
 * Track problems in a process
 * Returns array of problems found
 */
export function trackProblems(processID: string): Problem[] {
  const process = getProcessFromLocalStorage(processID);
  if (!process) {
    return [];
  }

  const problems: Problem[] = [];
  const activities = process.activities || [];

  // Handle variables - can be object or array
  let variablesObj: ProcessVariables = {};
  if (process.variables) {
    if (Array.isArray(process.variables)) {
      // Convert array to object format
      process.variables.forEach((variable: any) => {
        variablesObj[variable.name] = {
          type: variable.type || "string",
          isArgument: variable.isArgument || false,
          defaultValue: variable.value || variable.defaultValue || "",
        };
      });
    } else if (typeof process.variables === "object") {
      // Already in object format
      variablesObj = process.variables as ProcessVariables;
    }
  }

  // Track problem IDs to avoid duplicates
  let problemIdCounter = 1;

  activities.forEach((activity: Activity) => {
    // Skip label and flow activities
    if (
      activity.activityType === "label" ||
      activity.activityType === "bpmn:SequenceFlow" ||
      activity.activityType === "bpmn:sequenceFlow" ||
      activity.activityType === "bpmn:MessageFlow" ||
      activity.activityType === "bpmn:StartEvent" ||
      activity.activityType === "bpmn:EndEvent" ||
      activity.activityType === "bpmn:ExclusiveGateway" ||
      activity.activityType === "bpmn:ParallelGateway" ||
      activity.activityType === "bpmn:InclusiveGateway"
    ) {
      return;
    }

    const properties = activity.properties as ActivityProperties;
    const displayName = getActivityDisplayName(activity);

    // Check if activity has activityPackage assigned
    if (!properties?.activityPackage || properties.activityPackage === "") {
      problems.push({
        id: `problem_${problemIdCounter++}`,
        type: "error",
        nodeName: displayName,
        content: "Node does not assign Activitypackage",
      });
      return; // Skip argument checks if no activity package
    }

    // Check arguments if they exist
    if (properties.arguments && typeof properties.arguments === "object") {
      const activityPackage = properties.activityPackage || "";
      const activityName = properties.activityName || "";

      Object.entries(properties.arguments).forEach(([argName, argValue]) => {
        if (!argValue || typeof argValue !== "object") return;

        const value = argValue.value;

        // Check if value is empty or null
        if (value === null || value === undefined || value === "") {
          // Format: {activityPackage}.{activityName}.{argument} must not be empty
          if (activityPackage && activityName) {
            const highlightedPart = `${activityPackage}.${activityName}.${argName}`;
            problems.push({
              id: `problem_${problemIdCounter++}`,
              type: "error",
              nodeName: displayName,
              content: React.createElement(
                Text,
                { fontSize: "sm", color: "gray.700" },
                React.createElement(
                  Text,
                  { as: "span", fontWeight: "medium", fontStyle: "italic" },
                  highlightedPart,
                ),
                " must not be empty",
              ),
            });
          } else {
            problems.push({
              id: `problem_${problemIdCounter++}`,
              type: "error",
              nodeName: displayName,
              content: `${argName} must not be empty.`,
            });
          }
          return;
        }

        // Check if value references a variable
        const variableName = extractVariableName(value);
        if (variableName) {
          // Variable reference found, check if variable exists
          if (!variableExists(variableName, variablesObj)) {
            problems.push({
              id: `problem_${problemIdCounter++}`,
              type: "error",
              nodeName: displayName,
              content: `Variable "${variableName}" referenced in "${argName}" does not exist.`,
            });
          }
        }
        // If value is not empty and not a variable reference, it's OK (static value)
      });
    }
  });

  return problems;
}
