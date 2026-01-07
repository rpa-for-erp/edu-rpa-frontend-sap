/**
 * Utility to filter activities and variables for subprocess
 */

/**
 * Get all node IDs within a subprocess
 */
export function getSubProcessNodeIds(
  modeler: any,
  subProcessId: string
): string[] {
  try {
    const elementRegistry = modeler.get("elementRegistry");
    const subProcess = elementRegistry.get(subProcessId);

    if (!subProcess) {
      console.warn("⚠️ SubProcess not found:", subProcessId);
      return [];
    }

    // Get flowElements from businessObject
    const flowElements = subProcess.businessObject?.flowElements || [];

    // Extract IDs from all flowElements (tasks, events, gateways, NOT flows)
    const nodeIds = flowElements
      .filter((el: any) => {
        const type = el.$type;
        // Exclude sequence flows
        return type !== "bpmn:sequenceFlow" && type !== "bpmn:SequenceFlow";
      })
      .map((el: any) => el.id);

    console.log("📦 SubProcess node IDs:", nodeIds);
    return nodeIds;
  } catch (error) {
    console.error("Error getting subprocess node IDs:", error);
    return [];
  }
}

/**
 * Filter activities to only include those in subprocess
 */
export function filterActivitiesForSubProcess(
  activities: any[],
  subProcessNodeIds: string[]
): any[] {
  if (!activities || activities.length === 0) {
    console.log("ℹ️ No activities to filter");
    return [];
  }

  const filtered = activities.filter((activity: any) => {
    // Check if activity's activityID matches any node in subprocess
    return subProcessNodeIds.includes(activity.activityID);
  });

  console.log(
    "📊 Filtered activities:",
    filtered.length,
    "/",
    activities.length
  );
  console.log(
    "  Original activities:",
    activities.map((a) => a.activityID)
  );
  console.log(
    "  Filtered activities:",
    filtered.map((a) => a.activityID)
  );

  return filtered;
}

/**
 * Filter variables that are used in subprocess activities
 */
export function filterVariablesForSubProcess(
  variables: any,
  filteredActivities: any[]
): any {
  if (!variables || Object.keys(variables).length === 0) {
    console.log("ℹ️ No variables to filter");
    return {};
  }

  // Collect all variable references from filtered activities
  const usedVariableNames = new Set<string>();

  filteredActivities.forEach((activity: any) => {
    // Extract variable references from activity properties
    // This depends on your activity structure

    // Common places variables might be referenced:
    // - activity.properties
    // - activity.inputMapping
    // - activity.outputMapping
    // - activity.parameters

    if (activity.properties) {
      Object.values(activity.properties).forEach((value: any) => {
        if (typeof value === "string") {
          // Find variable references like ${varName} or {{varName}}
          const varMatches = value.match(/\$\{(\w+)\}|\{\{(\w+)\}\}/g);
          if (varMatches) {
            varMatches.forEach((match: string) => {
              const varName = match.replace(/[\$\{\}]/g, "");
              usedVariableNames.add(varName);
            });
          }
        }
      });
    }

    // Check inputMapping
    if (activity.inputMapping) {
      Object.keys(activity.inputMapping).forEach((key: string) => {
        usedVariableNames.add(key);
      });
    }

    // Check outputMapping
    if (activity.outputMapping) {
      Object.keys(activity.outputMapping).forEach((key: string) => {
        usedVariableNames.add(key);
      });
    }

    // Check parameters
    if (activity.parameters) {
      Object.values(activity.parameters).forEach((param: any) => {
        if (typeof param === "string") {
          const varMatches = param.match(/\$\{(\w+)\}|\{\{(\w+)\}\}/g);
          if (varMatches) {
            varMatches.forEach((match: string) => {
              const varName = match.replace(/[\$\{\}]/g, "");
              usedVariableNames.add(varName);
            });
          }
        }
      });
    }
  });

  // Filter variables to only include used ones
  const filteredVariables: any = {};
  Object.keys(variables).forEach((varName: string) => {
    if (usedVariableNames.has(varName)) {
      filteredVariables[varName] = variables[varName];
    }
  });

  console.log(
    "📊 Filtered variables:",
    Object.keys(filteredVariables).length,
    "/",
    Object.keys(variables).length
  );
  console.log("  Original variables:", Object.keys(variables));
  console.log("  Used in subprocess:", Array.from(usedVariableNames));
  console.log("  Filtered variables:", Object.keys(filteredVariables));

  return filteredVariables;
}

/**
 * Extract all data needed for subprocess process creation
 */
export function extractSubProcessData(
  modeler: any,
  subProcessId: string,
  allActivities: any[],
  allVariables: any
): {
  activities: any[];
  variables: any;
  nodeIds: string[];
} {
  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("║  EXTRACTING SUBPROCESS DATA               ║");
  console.log("╚═══════════════════════════════════════════╝");

  // Get node IDs in subprocess
  const nodeIds = getSubProcessNodeIds(modeler, subProcessId);

  // Filter activities
  const filteredActivities = filterActivitiesForSubProcess(
    allActivities,
    nodeIds
  );

  // Filter variables based on activities
  const filteredVariables = filterVariablesForSubProcess(
    allVariables,
    filteredActivities
  );

  console.log("\n✅ Extraction complete!");
  console.log("  - Nodes:", nodeIds.length);
  console.log("  - Activities:", filteredActivities.length);
  console.log("  - Variables:", Object.keys(filteredVariables).length);
  console.log("╚═══════════════════════════════════════════╝\n");

  return {
    activities: filteredActivities,
    variables: filteredVariables,
    nodeIds,
  };
}
