import { useState, useEffect, useCallback, useMemo } from 'react';
import { getProcessFromLocalStorage } from '@/utils/processService';
import { Activity } from '@/types/activity';

export interface VariableUsageInfo {
  activityId: string;
  activityName: string;
  packageName: string;
}

export interface VariableUsageMap {
  [variableName: string]: VariableUsageInfo[];
}

/**
 * Custom event name for properties update
 * Dispatched when activity properties are updated (variable assigned to package)
 */
export const PROPERTIES_UPDATED_EVENT = 'properties-updated';

/**
 * Dispatch properties-updated event to notify listeners
 * Call this when properties are saved in PropertiesSideBar or PropertiesPanel
 */
export const dispatchPropertiesUpdated = (processID: string) => {
  const event = new CustomEvent(PROPERTIES_UPDATED_EVENT, {
    detail: { processID },
  });
  window.dispatchEvent(event);
};

/**
 * Hook to track which activities/packages are using each variable
 * Listens for properties-updated events to refresh the usage map
 * 
 * @param processID - The process ID to track variable usage for
 * @param variableNames - List of variable names to track
 * @returns VariableUsageMap - Map of variable name to list of activities using it
 */
export const useVariableUsage = (
  processID: string | undefined,
  variableNames: string[]
): VariableUsageMap => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for properties-updated events
  useEffect(() => {
    const handlePropertiesUpdate = (event: CustomEvent) => {
      if (event.detail.processID === processID) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    window.addEventListener(
      PROPERTIES_UPDATED_EVENT,
      handlePropertiesUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        PROPERTIES_UPDATED_EVENT,
        handlePropertiesUpdate as EventListener
      );
    };
  }, [processID]);

  // Compute variable usage map
  const usageMap = useMemo(() => {
    const map: VariableUsageMap = {};

    if (!processID) return map;

    const process = getProcessFromLocalStorage(processID);
    if (!process?.activities) return map;

    // Initialize empty arrays for all variable names
    variableNames.forEach((name) => {
      if (name) map[name] = [];
    });

    // Check each activity's properties for variable references
    process.activities.forEach((activity: Activity) => {
      const activityName = activity.activityName || activity.activityID;
      const properties = activity.properties as Record<string, any>;

      if (!properties) return;

      const packageName = properties.activityPackage || '';
      const displayActivityName = properties.activityName || activityName;

      // Search for variable references in properties
      const searchForVariables = (obj: any) => {
        if (typeof obj === 'string') {
          variableNames.forEach((varName) => {
            if (!varName) return;
            
            // Check for ${varName}, $varName, @{varName}, &{varName} patterns (Robot Framework format)
            const patterns = [
              `\${${varName}}`,
              `$${varName}`,
              `@{${varName}}`,
              `&{${varName}}`,
              varName, // Also check for exact match
            ];

            const hasMatch = patterns.some((pattern) => obj.includes(pattern));

            if (hasMatch) {
              // Check if this activity is already in the list
              const existingEntry = map[varName]?.find(
                (entry) => entry.activityId === activity.activityID
              );

              if (!existingEntry) {
                if (!map[varName]) map[varName] = [];
                map[varName].push({
                  activityId: activity.activityID,
                  activityName: displayActivityName,
                  packageName: packageName,
                });
              }
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach((value) => searchForVariables(value));
        }
      };

      // Search in arguments
      if (properties.arguments) {
        searchForVariables(properties.arguments);
      }

      // Search in return value (result variable)
      if (properties.return) {
        searchForVariables(properties.return);
      }
    });

    return map;
  }, [processID, variableNames, refreshTrigger]);

  return usageMap;
};

/**
 * Helper function to format usage display
 * @param usageInfo - List of activities using the variable
 * @returns Formatted string showing package/activity names
 */
export const formatVariableUsage = (usageInfo: VariableUsageInfo[]): string => {
  if (!usageInfo || usageInfo.length === 0) return '';

  return usageInfo
    .map((info) => {
      if (info.packageName && info.activityName) {
        return `${info.packageName} > ${info.activityName}`;
      }
      return info.activityName || info.activityId;
    })
    .join(', ');
};

export default useVariableUsage;
