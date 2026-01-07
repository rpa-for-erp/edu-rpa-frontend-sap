/**
 * Utility to extract subprocess as standalone process
 */

export interface ExtractedSubProcess {
  xml: string;
  name: string;
  hasNestedSubProcesses: boolean;
  elementCount: number;
}

/**
 * Check if a subprocess contains nested subprocesses
 */
export function hasNestedSubProcesses(
  modeler: any,
  subProcessId: string
): boolean {
  try {
    const elementRegistry = modeler.get("elementRegistry");
    const subProcess = elementRegistry.get(subProcessId);

    if (!subProcess) {
      console.warn("⚠️ SubProcess not found:", subProcessId);
      return false;
    }

    // Get all children of the subprocess
    const children = subProcess.children || [];

    console.log("🔍 Checking for nested subprocesses in:", subProcessId);
    console.log("🔍 Children count:", children.length);

    // Check if any child is a subprocess (check both cases)
    const hasNested = children.some((child: any) => {
      const type = child.businessObject?.$type;
      const isSubProcess =
        type === "bpmn:SubProcess" || type === "bpmn:subProcess";
      if (isSubProcess) {
        console.log(
          "  ✅ Found nested subprocess:",
          child.id,
          child.businessObject?.name
        );
      }
      return isSubProcess;
    });

    console.log("📊 Has nested subprocesses:", hasNested);
    return hasNested;
  } catch (error) {
    console.error("Error checking nested subprocesses:", error);
    return false;
  }
}

/**
 * Extract subprocess as standalone BPMN process
 * Uses direct XML export from modeler for accurate representation
 */
export async function extractSubProcessAsProcess(
  modeler: any,
  subProcessId: string
): Promise<ExtractedSubProcess> {
  try {
    const elementRegistry = modeler.get("elementRegistry");
    const canvas = modeler.get("canvas");

    const subProcess = elementRegistry.get(subProcessId);
    if (!subProcess) {
      throw new Error("SubProcess not found");
    }

    const subProcessBO = subProcess.businessObject;
    const subProcessName = subProcessBO.name || "Untitled SubProcess";

    // Check for nested subprocesses
    const hasNested = hasNestedSubProcesses(modeler, subProcessId);

    // Count elements
    const children = subProcess.children || [];
    const elementCount = children.filter((child: any) => {
      const type = child.businessObject?.$type;
      return type && !type.includes("Label");
    }).length;

    // Get all flowElements from subprocess (includes tasks, events, gateways, AND sequence flows)
    const flowElements = subProcessBO.flowElements || [];

    console.log("📦 All FlowElements:", flowElements);
    console.log("📊 Total count:", flowElements.length);

    // Separate elements by type for debugging
    const tasks = flowElements.filter((el: any) => el.$type.includes("Task"));
    const events = flowElements.filter((el: any) => el.$type.includes("Event"));
    const flows = flowElements.filter(
      (el: any) =>
        el.$type === "bpmn:sequenceFlow" || el.$type === "bpmn:SequenceFlow"
    );
    const gateways = flowElements.filter((el: any) =>
      el.$type.includes("Gateway")
    );

    console.log("🔹 Tasks:", tasks.length);
    console.log("🔹 Events:", events.length);
    console.log("➡️ Sequence Flows:", flows.length);
    console.log("🔷 Gateways:", gateways.length);

    // Debug: log all element types to see casing
    console.log(
      "🔍 All types:",
      flowElements.map((el: any) => el.$type)
    );

    // Build XML manually with only subprocess content
    const processId = `Process_${Date.now().toString(36)}`;
    const definitionsId = `Definitions_${Date.now().toString(36)}`;
    const diagramId = `BPMNDiagram_${Date.now().toString(36)}`;
    const planeId = `BPMNPlane_${Date.now().toString(36)}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="${definitionsId}" targetNamespace="http://bpmn.io/schema/bpmn" exporter="edu-rpa" exporterVersion="1.0">
  <bpmn:process id="${processId}" isExecutable="false">\n`;

    // Build element ID map for DI
    const elementBounds = new Map<string, any>();
    let yOffset = 100;
    const xStart = 100;
    const spacing = 150;

    // First pass: collect all elements and their info
    flowElements.forEach((element: any, index: number) => {
      const elementType = element.$type;

      // Get bounds from DI if available
      const diElement = children.find((child: any) => child.id === element.id);
      if (diElement) {
        elementBounds.set(element.id, {
          x: diElement.x || xStart + index * spacing,
          y: diElement.y || yOffset,
          width: diElement.width || 100,
          height: diElement.height || 80,
        });
      } else {
        // Default bounds
        elementBounds.set(element.id, {
          x: xStart + index * spacing,
          y: yOffset,
          width: elementType.includes("Event") ? 36 : 100,
          height: elementType.includes("Event") ? 36 : 80,
        });
      }
    });

    // Generate BPMN elements
    flowElements.forEach((element: any) => {
      const elementType = element.$type.replace("bpmn:", "");
      const name = element.name ? ` name="${escapeXml(element.name)}"` : "";
      const elementId = element.id;

      // Handle sequence flows differently (check both lowercase and capital case)
      if (elementType === "sequenceFlow" || elementType === "SequenceFlow") {
        console.log(`🔍 Processing SequenceFlow:`, element.id);
        console.log(`  - Full element:`, element);

        // sourceRef and targetRef can be either:
        // 1. An object with .id property (after bpmn-js parsing)
        // 2. A string ID (rare)
        // 3. Undefined (need to infer from other elements)
        let sourceRef = "";
        let targetRef = "";

        if (typeof element.sourceRef === "object" && element.sourceRef) {
          sourceRef = element.sourceRef.id || "";
        } else if (typeof element.sourceRef === "string") {
          sourceRef = element.sourceRef;
        }

        if (typeof element.targetRef === "object" && element.targetRef) {
          targetRef = element.targetRef.id || "";
        } else if (typeof element.targetRef === "string") {
          targetRef = element.targetRef;
        }

        // If still missing, try to infer from other elements' incoming/outgoing
        if (!sourceRef || !targetRef) {
          console.warn(
            `⚠️ SequenceFlow ${elementId} missing refs, trying to infer...`
          );

          // Find source: element that has this flow in outgoing
          const sourceElement = flowElements.find((el: any) =>
            el.outgoing?.some((out: any) => out.id === elementId)
          );
          if (sourceElement) {
            sourceRef = sourceElement.id;
            console.log(`  ✓ Inferred sourceRef: ${sourceRef}`);
          }

          // Find target: element that has this flow in incoming
          const targetElement = flowElements.find((el: any) =>
            el.incoming?.some((inc: any) => inc.id === elementId)
          );
          if (targetElement) {
            targetRef = targetElement.id;
            console.log(`  ✓ Inferred targetRef: ${targetRef}`);
          }
        }

        if (!sourceRef || !targetRef) {
          console.error(
            `❌ SequenceFlow ${elementId} cannot determine refs!`,
            `Source: ${sourceRef}, Target: ${targetRef}`
          );
          // Skip this flow - invalid
          return;
        }

        xml += `    <bpmn:sequenceFlow id="${elementId}"${name} sourceRef="${sourceRef}" targetRef="${targetRef}" />\n`;
        console.log(`✅ Added flow: ${sourceRef} → ${targetRef}`);
        return;
      }

      // Regular elements (tasks, events, gateways, etc)
      xml += `    <bpmn:${elementType} id="${elementId}"${name}>\n`;

      // Add incoming/outgoing
      if (element.incoming && element.incoming.length > 0) {
        element.incoming.forEach((flow: any) => {
          xml += `      <bpmn:incoming>${flow.id}</bpmn:incoming>\n`;
        });
      }

      if (element.outgoing && element.outgoing.length > 0) {
        element.outgoing.forEach((flow: any) => {
          xml += `      <bpmn:outgoing>${flow.id}</bpmn:outgoing>\n`;
        });
      }

      // Handle nested subprocess recursively
      if (elementType === "subProcess" && element.flowElements) {
        // Add nested content (simplified - you may need to recursively handle this)
        element.flowElements.forEach((nestedEl: any) => {
          const nestedType = nestedEl.$type.replace("bpmn:", "");
          const nestedName = nestedEl.name
            ? ` name="${escapeXml(nestedEl.name)}"`
            : "";
          xml += `      <bpmn:${nestedType} id="${nestedEl.id}"${nestedName} />\n`;
        });
      }

      xml += `    </bpmn:${elementType}>\n`;
    });

    xml += `  </bpmn:process>\n`;

    // Generate BPMN DI (Diagram Interchange)
    xml += `  <bpmndi:BPMNDiagram id="${diagramId}">\n`;
    xml += `    <bpmndi:BPMNPlane id="${planeId}" bpmnElement="${processId}">\n`;

    // Generate shapes for each element
    flowElements.forEach((element: any) => {
      const bounds = elementBounds.get(element.id);
      if (!bounds) return;

      const isFlow =
        element.$type === "bpmn:sequenceFlow" ||
        element.$type === "bpmn:SequenceFlow";
      if (isFlow) return; // Skip flows in shapes

      xml += `      <bpmndi:BPMNShape id="${element.id}_di" bpmnElement="${element.id}">\n`;
      xml += `        <dc:Bounds x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" />\n`;
      xml += `      </bpmndi:BPMNShape>\n`;
    });

    // Generate edges for sequence flows
    flowElements.forEach((element: any) => {
      if (
        element.$type !== "bpmn:sequenceFlow" &&
        element.$type !== "bpmn:SequenceFlow"
      )
        return;

      // Extract source and target IDs (handle both object and string formats)
      let sourceId = "";
      let targetId = "";

      if (typeof element.sourceRef === "object" && element.sourceRef) {
        sourceId = element.sourceRef.id || "";
      } else if (typeof element.sourceRef === "string") {
        sourceId = element.sourceRef;
      }

      if (typeof element.targetRef === "object" && element.targetRef) {
        targetId = element.targetRef.id || "";
      } else if (typeof element.targetRef === "string") {
        targetId = element.targetRef;
      }

      // If still missing, infer from incoming/outgoing
      if (!sourceId || !targetId) {
        const sourceElement = flowElements.find((el: any) =>
          el.outgoing?.some((out: any) => out.id === element.id)
        );
        if (sourceElement) sourceId = sourceElement.id;

        const targetElement = flowElements.find((el: any) =>
          el.incoming?.some((inc: any) => inc.id === element.id)
        );
        if (targetElement) targetId = targetElement.id;
      }

      if (!sourceId || !targetId) {
        console.warn(
          `⚠️ Cannot create edge for flow ${element.id}: missing source or target`
        );
        return;
      }

      const sourceBounds = elementBounds.get(sourceId);
      const targetBounds = elementBounds.get(targetId);

      if (!sourceBounds || !targetBounds) {
        console.warn(
          `⚠️ Cannot create edge for flow ${element.id}: missing bounds for ${sourceId} or ${targetId}`
        );
        return;
      }

      xml += `      <bpmndi:BPMNEdge id="${element.id}_di" bpmnElement="${element.id}">\n`;
      xml += `        <di:waypoint x="${
        sourceBounds.x + sourceBounds.width
      }" y="${sourceBounds.y + sourceBounds.height / 2}" />\n`;
      xml += `        <di:waypoint x="${targetBounds.x}" y="${
        targetBounds.y + targetBounds.height / 2
      }" />\n`;
      xml += `      </bpmndi:BPMNEdge>\n`;

      console.log(
        `✅ Added edge for flow ${element.id}: ${sourceId} → ${targetId}`
      );
    });

    xml += `    </bpmndi:BPMNPlane>\n`;
    xml += `  </bpmndi:BPMNDiagram>\n`;
    xml += `</bpmn:definitions>\n`;

    return {
      xml,
      name: subProcessName,
      hasNestedSubProcesses: hasNested,
      elementCount,
    };
  } catch (error) {
    console.error("Error extracting subprocess:", error);
    throw error;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Count elements in subprocess
 */
export function countSubProcessElements(
  modeler: any,
  subProcessId: string
): number {
  try {
    const elementRegistry = modeler.get("elementRegistry");
    const subProcess = elementRegistry.get(subProcessId);

    if (!subProcess) return 0;

    const children = subProcess.children || [];
    return children.filter((child: any) => {
      const type = child.businessObject?.$type;
      // Count only meaningful elements (not labels, etc)
      return type && !type.includes("Label") && type.includes("bpmn:");
    }).length;
  } catch (error) {
    console.error("Error counting elements:", error);
    return 0;
  }
}
