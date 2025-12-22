import { useCallback } from "react";
import {
  BpmnJsonData,
  convertJsonToBpmn,
  convertJsonToProcess,
  importJsonToModeler,
  importJsonToModelerWithActivities,
  validateBpmnJson,
  LayoutOptions,
} from "@/utils/bpmn-parser/json-to-bpmn-xml.util";
import { Activity } from "@/types/activity";
import { Variable } from "@/types/variable";

/**
 * Hook to convert JSON data to BPMN XML and optionally import into modeler
 *
 * @example
 * ```tsx
 * const { convertToXml, convertToProcess, importToModeler, validate } = useJsonToBpmn();
 *
 * // Just convert to XML
 * const xmlResult = convertToXml(jsonData);
 * if (xmlResult.success) {
 *   console.log(xmlResult.xml);
 * }
 *
 * // Convert to full process data (XML + activities + variables)
 * const processResult = convertToProcess(jsonData);
 * if (processResult.success) {
 *   console.log(processResult.xml);
 *   console.log(processResult.activities);
 *   console.log(processResult.variables);
 * }
 *
 * // Import directly into the modeler with activities
 * const bpmnReactJs = useBpmn();
 * const { activities, variables } = await importToModelerWithActivities(
 *   bpmnReactJs.bpmnModeler,
 *   jsonData
 * );
 * ```
 */
export function useJsonToBpmn() {
  /**
   * Validate JSON structure before conversion
   */
  const validate = useCallback((data: unknown) => {
    return validateBpmnJson(data);
  }, []);

  /**
   * Convert JSON to BPMN XML string only
   */
  const convertToXml = useCallback((data: unknown) => {
    return convertJsonToBpmn(data);
  }, []);

  /**
   * Convert JSON to full process data: XML + activities + variables
   */
  const convertToProcess = useCallback(
    (data: unknown, layoutOptions?: LayoutOptions) => {
      return convertJsonToProcess(data, layoutOptions);
    },
    []
  );

  /**
   * Import JSON data directly into a bpmn-js modeler instance
   */
  const importToModeler = useCallback(
    async (modeler: any, data: BpmnJsonData) => {
      if (!modeler) {
        throw new Error("Modeler instance is required");
      }
      return importJsonToModeler(modeler, data);
    },
    []
  );

  /**
   * Import JSON to modeler and get activities + variables
   */
  const importToModelerWithActivities = useCallback(
    async (
      modeler: any,
      data: BpmnJsonData,
      layoutOptions?: LayoutOptions
    ): Promise<{
      warnings?: string[];
      activities: Activity[];
      variables: Variable[];
    }> => {
      if (!modeler) {
        throw new Error("Modeler instance is required");
      }
      return importJsonToModelerWithActivities(modeler, data, layoutOptions);
    },
    []
  );

  /**
   * Convert JSON and save to localStorage for the process
   * This integrates with the existing localStorage process management
   */
  const convertAndSaveToLocalStorage = useCallback(
    (data: BpmnJsonData, processId: string, layoutOptions?: LayoutOptions) => {
      const result = convertJsonToProcess(data, layoutOptions);

      if (!result.success || !result.xml) {
        return { success: false, errors: result.errors };
      }

      try {
        // Get existing localStorage data
        const processListStr = localStorage.getItem("processList");
        const processList = processListStr ? JSON.parse(processListStr) : [];

        // Find or create process entry
        const existingIndex = processList.findIndex(
          (p: any) => p.processID === processId
        );

        const processData = {
          processID: processId,
          xml: result.xml,
          activities: result.activities || [],
          variables: result.variables || [],
        };

        if (existingIndex >= 0) {
          processList[existingIndex] = {
            ...processList[existingIndex],
            ...processData,
          };
        } else {
          processList.push(processData);
        }

        localStorage.setItem("processList", JSON.stringify(processList));

        return {
          success: true,
          xml: result.xml,
          activities: result.activities,
          variables: result.variables,
        };
      } catch (error) {
        return {
          success: false,
          errors: [
            `Failed to save to localStorage: ${(error as Error).message}`,
          ],
        };
      }
    },
    []
  );

  return {
    validate,
    convertToXml,
    convertToProcess,
    importToModeler,
    importToModelerWithActivities,
    convertAndSaveToLocalStorage,
  };
}

export default useJsonToBpmn;
