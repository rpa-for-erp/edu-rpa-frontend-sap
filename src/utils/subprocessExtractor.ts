/**
 * Utility to extract subprocess as standalone process
 */

import { layoutProcess } from "bpmn-auto-layout";

export interface ExtractedSubProcess {
  xml: string;
  name: string;
  hasNestedSubProcesses: boolean;
  elementCount: number;
}

export interface ExtractionOptions {
  /** Use bpmn-auto-layout to auto-arrange elements (default: false) */
  useAutoLayout?: boolean;
  /** Padding from top-left corner (default: 100) */
  padding?: number;
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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Check if element type is a sequence flow
 */
function isSequenceFlow(type: string): boolean {
  const normalizedType = type.replace("bpmn:", "").toLowerCase();
  return normalizedType === "sequenceflow";
}

/**
 * Check if element type is a subprocess
 */
function isSubProcessType(type: string): boolean {
  const normalizedType = type.replace("bpmn:", "").toLowerCase();
  return normalizedType === "subprocess";
}

/**
 * Get source and target refs from a sequence flow element
 */
function getFlowRefs(
  element: any,
  flowElements: any[]
): { sourceRef: string; targetRef: string } {
  let sourceRef = "";
  let targetRef = "";

  // Try to get from element directly
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
    const elementId = element.id;

    // Find source: element that has this flow in outgoing
    const sourceElement = flowElements.find((el: any) =>
      el.outgoing?.some((out: any) => out.id === elementId)
    );
    if (sourceElement && !sourceRef) {
      sourceRef = sourceElement.id;
    }

    // Find target: element that has this flow in incoming
    const targetElement = flowElements.find((el: any) =>
      el.incoming?.some((inc: any) => inc.id === elementId)
    );
    if (targetElement && !targetRef) {
      targetRef = targetElement.id;
    }
  }

  return { sourceRef, targetRef };
}

interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlowWaypoints {
  waypoints: Array<{ x: number; y: number }>;
}

/**
 * Recursively collect all element bounds from modeler shapes
 * This gets the ACTUAL positions from the diagram
 */
function collectAllBoundsFromShapes(
  flowElements: any[],
  elementRegistry: any,
  elementBounds: Map<string, ElementBounds>,
  flowWaypoints: Map<string, FlowWaypoints>,
  parentOffset: { x: number; y: number } = { x: 0, y: 0 }
): void {
  flowElements.forEach((element: any) => {
    const elementId = element.id;
    const elementType = element.$type;

    // Get the shape from element registry
    const shape = elementRegistry.get(elementId);

    if (shape) {
      if (isSequenceFlow(elementType)) {
        // For sequence flows, get waypoints from the connection
        const waypoints = shape.waypoints || [];
        if (waypoints.length > 0) {
          flowWaypoints.set(elementId, {
            waypoints: waypoints.map((wp: any) => ({
              x: wp.x - parentOffset.x,
              y: wp.y - parentOffset.y,
            })),
          });
          console.log(
            `📍 Got waypoints for flow ${elementId}:`,
            waypoints.length,
            "points"
          );
        }
      } else {
        // For shapes, get bounds
        elementBounds.set(elementId, {
          x: shape.x - parentOffset.x,
          y: shape.y - parentOffset.y,
          width: shape.width || 100,
          height: shape.height || 80,
        });
        console.log(
          `📍 Got bounds for ${elementId}: (${shape.x}, ${shape.y}) ${shape.width}x${shape.height}`
        );
      }
    } else {
      // Fallback: try to get from DI
      const di = element.di;
      if (di && di.bounds) {
        elementBounds.set(elementId, {
          x: di.bounds.x - parentOffset.x,
          y: di.bounds.y - parentOffset.y,
          width: di.bounds.width || 100,
          height: di.bounds.height || 80,
        });
        console.log(`📍 Got bounds from DI for ${elementId}`);
      } else {
        console.warn(`⚠️ No shape or DI found for ${elementId}`);
      }
    }

    // Recursively collect bounds for nested subprocess elements
    if (isSubProcessType(elementType) && element.flowElements) {
      // Get the nested subprocess shape to calculate offset
      const nestedShape = elementRegistry.get(elementId);
      const nestedOffset = {
        x: parentOffset.x + (nestedShape?.x || 0),
        y: parentOffset.y + (nestedShape?.y || 0),
      };

      collectAllBoundsFromShapes(
        element.flowElements,
        elementRegistry,
        elementBounds,
        flowWaypoints,
        nestedOffset
      );
    }
  });
}

/**
 * Normalize bounds to start from a reasonable position
 * This prevents elements from being placed at extreme coordinates
 */
function normalizeBounds(
  elementBounds: Map<string, ElementBounds>,
  flowWaypoints: Map<string, FlowWaypoints>,
  padding: number
): void {
  // Find minimum x and y
  let minX = Infinity;
  let minY = Infinity;

  elementBounds.forEach((bounds) => {
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
  });

  flowWaypoints.forEach((flow) => {
    flow.waypoints.forEach((wp) => {
      minX = Math.min(minX, wp.x);
      minY = Math.min(minY, wp.y);
    });
  });

  // Calculate offset to normalize to padding position
  const offsetX = padding - minX;
  const offsetY = padding - minY;

  console.log(`📐 Normalizing positions: offset (${offsetX}, ${offsetY})`);
  console.log(
    `📐 Min found: (${minX}, ${minY}) -> Moving to (${padding}, ${padding})`
  );

  // Apply offset to all bounds
  elementBounds.forEach((bounds, key) => {
    elementBounds.set(key, {
      ...bounds,
      x: bounds.x + offsetX,
      y: bounds.y + offsetY,
    });
  });

  // Apply offset to all waypoints
  flowWaypoints.forEach((flow, key) => {
    flowWaypoints.set(key, {
      waypoints: flow.waypoints.map((wp) => ({
        x: wp.x + offsetX,
        y: wp.y + offsetY,
      })),
    });
  });
}

/**
 * Generate XML for a sequence flow element
 */
function generateSequenceFlowXml(
  element: any,
  flowElements: any[],
  indent: string
): string {
  const name = element.name ? ` name="${escapeXml(element.name)}"` : "";
  const elementId = element.id;

  const { sourceRef, targetRef } = getFlowRefs(element, flowElements);

  if (!sourceRef || !targetRef) {
    console.error(
      `❌ SequenceFlow ${elementId} cannot determine refs!`,
      `Source: ${sourceRef}, Target: ${targetRef}`
    );
    return "";
  }

  console.log(`✅ Added flow: ${sourceRef} → ${targetRef}`);
  return `${indent}<bpmn:sequenceFlow id="${elementId}"${name} sourceRef="${sourceRef}" targetRef="${targetRef}" />\n`;
}

/**
 * Recursively generate XML for flow elements including nested subprocesses
 */
function generateFlowElementsXml(flowElements: any[], indent: string): string {
  let xml = "";

  flowElements.forEach((element: any) => {
    const elementType = element.$type.replace("bpmn:", "");
    const name = element.name ? ` name="${escapeXml(element.name)}"` : "";
    const elementId = element.id;

    // Handle sequence flows
    if (isSequenceFlow(element.$type)) {
      xml += generateSequenceFlowXml(element, flowElements, indent);
      return;
    }

    // Check if this is a subprocess with nested content
    const hasNestedContent =
      isSubProcessType(element.$type) &&
      element.flowElements &&
      element.flowElements.length > 0;

    if (hasNestedContent) {
      // Open subprocess tag
      xml += `${indent}<bpmn:subProcess id="${elementId}"${name}>\n`;

      // Add incoming/outgoing
      if (element.incoming && element.incoming.length > 0) {
        element.incoming.forEach((flow: any) => {
          xml += `${indent}  <bpmn:incoming>${flow.id}</bpmn:incoming>\n`;
        });
      }

      if (element.outgoing && element.outgoing.length > 0) {
        element.outgoing.forEach((flow: any) => {
          xml += `${indent}  <bpmn:outgoing>${flow.id}</bpmn:outgoing>\n`;
        });
      }

      // Recursively add nested flow elements
      xml += generateFlowElementsXml(element.flowElements, indent + "  ");

      // Close subprocess tag
      xml += `${indent}</bpmn:subProcess>\n`;

      console.log(
        `📦 Added nested subprocess: ${elementId} with ${element.flowElements.length} elements`
      );
    } else {
      // Regular elements (tasks, events, gateways, etc)
      // Check if element has content (incoming/outgoing)
      const hasContent =
        (element.incoming && element.incoming.length > 0) ||
        (element.outgoing && element.outgoing.length > 0);

      if (hasContent) {
        xml += `${indent}<bpmn:${elementType} id="${elementId}"${name}>\n`;

        // Add incoming
        if (element.incoming && element.incoming.length > 0) {
          element.incoming.forEach((flow: any) => {
            xml += `${indent}  <bpmn:incoming>${flow.id}</bpmn:incoming>\n`;
          });
        }

        // Add outgoing
        if (element.outgoing && element.outgoing.length > 0) {
          element.outgoing.forEach((flow: any) => {
            xml += `${indent}  <bpmn:outgoing>${flow.id}</bpmn:outgoing>\n`;
          });
        }

        xml += `${indent}</bpmn:${elementType}>\n`;
      } else {
        // Self-closing tag for elements without content
        xml += `${indent}<bpmn:${elementType} id="${elementId}"${name} />\n`;
      }
    }
  });

  return xml;
}

/**
 * Recursively generate DI shapes for all elements including nested subprocess elements
 */
function generateDiShapes(
  flowElements: any[],
  elementBounds: Map<string, ElementBounds>,
  indent: string
): string {
  let xml = "";

  flowElements.forEach((element: any) => {
    // Skip sequence flows (they become edges, not shapes)
    if (isSequenceFlow(element.$type)) return;

    const bounds = elementBounds.get(element.id);
    if (bounds) {
      xml += `${indent}<bpmndi:BPMNShape id="${element.id}_di" bpmnElement="${element.id}">\n`;
      xml += `${indent}  <dc:Bounds x="${Math.round(bounds.x)}" y="${Math.round(
        bounds.y
      )}" width="${Math.round(bounds.width)}" height="${Math.round(
        bounds.height
      )}" />\n`;
      xml += `${indent}</bpmndi:BPMNShape>\n`;
    }

    // Recursively add shapes for nested subprocess elements
    if (isSubProcessType(element.$type) && element.flowElements) {
      xml += generateDiShapes(element.flowElements, elementBounds, indent);
    }
  });

  return xml;
}

/**
 * Recursively generate DI edges for all sequence flows including those in nested subprocesses
 */
function generateDiEdges(
  flowElements: any[],
  elementBounds: Map<string, ElementBounds>,
  flowWaypoints: Map<string, FlowWaypoints>,
  indent: string
): string {
  let xml = "";

  flowElements.forEach((element: any) => {
    // Handle sequence flows
    if (isSequenceFlow(element.$type)) {
      const { sourceRef: sourceId, targetRef: targetId } = getFlowRefs(
        element,
        flowElements
      );

      if (!sourceId || !targetId) {
        console.warn(
          `⚠️ Cannot create edge for flow ${element.id}: missing source or target`
        );
        return;
      }

      xml += `${indent}<bpmndi:BPMNEdge id="${element.id}_di" bpmnElement="${element.id}">\n`;

      // Try to use original waypoints first
      const originalWaypoints = flowWaypoints.get(element.id);
      if (originalWaypoints && originalWaypoints.waypoints.length > 0) {
        // Use original waypoints from the diagram
        originalWaypoints.waypoints.forEach((wp) => {
          xml += `${indent}  <di:waypoint x="${Math.round(
            wp.x
          )}" y="${Math.round(wp.y)}" />\n`;
        });
        console.log(
          `✅ Added edge for flow ${element.id} with ${originalWaypoints.waypoints.length} original waypoints`
        );
      } else {
        // Fallback: calculate simple waypoints from bounds
        const sourceBounds = elementBounds.get(sourceId);
        const targetBounds = elementBounds.get(targetId);

        if (sourceBounds && targetBounds) {
          xml += `${indent}  <di:waypoint x="${Math.round(
            sourceBounds.x + sourceBounds.width
          )}" y="${Math.round(sourceBounds.y + sourceBounds.height / 2)}" />\n`;
          xml += `${indent}  <di:waypoint x="${Math.round(
            targetBounds.x
          )}" y="${Math.round(targetBounds.y + targetBounds.height / 2)}" />\n`;
          console.log(
            `✅ Added edge for flow ${element.id} with calculated waypoints`
          );
        } else {
          console.warn(
            `⚠️ Cannot create edge for flow ${element.id}: missing bounds`
          );
          xml += `${indent}  <di:waypoint x="0" y="0" />\n`;
          xml += `${indent}  <di:waypoint x="100" y="0" />\n`;
        }
      }

      xml += `${indent}</bpmndi:BPMNEdge>\n`;
    }

    // Recursively add edges for nested subprocess elements
    if (isSubProcessType(element.$type) && element.flowElements) {
      xml += generateDiEdges(
        element.flowElements,
        elementBounds,
        flowWaypoints,
        indent
      );
    }
  });

  return xml;
}

/**
 * Extract subprocess as standalone BPMN process
 * Uses direct XML export from modeler for accurate representation
 */
export async function extractSubProcessAsProcess(
  modeler: any,
  subProcessId: string,
  options: ExtractionOptions = {}
): Promise<ExtractedSubProcess> {
  const { useAutoLayout = false, padding = 100 } = options;

  try {
    const elementRegistry = modeler.get("elementRegistry");

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

    // Get all flowElements from subprocess
    const flowElements = subProcessBO.flowElements || [];

    console.log("📦 All FlowElements:", flowElements);
    console.log("📊 Total count:", flowElements.length);

    // Separate elements by type for debugging
    const tasks = flowElements.filter((el: any) => el.$type.includes("Task"));
    const events = flowElements.filter((el: any) => el.$type.includes("Event"));
    const flows = flowElements.filter((el: any) => isSequenceFlow(el.$type));
    const gateways = flowElements.filter((el: any) =>
      el.$type.includes("Gateway")
    );
    const subProcesses = flowElements.filter((el: any) =>
      isSubProcessType(el.$type)
    );

    console.log("🔹 Tasks:", tasks.length);
    console.log("🔹 Events:", events.length);
    console.log("➡️ Sequence Flows:", flows.length);
    console.log("🔷 Gateways:", gateways.length);
    console.log("📦 Nested SubProcesses:", subProcesses.length);

    // Build XML manually with only subprocess content
    const processId = `Process_${Date.now().toString(36)}`;
    const definitionsId = `Definitions_${Date.now().toString(36)}`;
    const diagramId = `BPMNDiagram_${Date.now().toString(36)}`;
    const planeId = `BPMNPlane_${Date.now().toString(36)}`;

    // Collect bounds from actual shapes in the modeler
    const elementBounds = new Map<string, ElementBounds>();
    const flowWaypoints = new Map<string, FlowWaypoints>();

    // Get parent subprocess position as offset
    const parentOffset = {
      x: subProcess.x || 0,
      y: subProcess.y || 0,
    };

    console.log(
      `📐 Parent subprocess position: (${parentOffset.x}, ${parentOffset.y})`
    );

    // Collect all bounds recursively from shapes
    collectAllBoundsFromShapes(
      flowElements,
      elementRegistry,
      elementBounds,
      flowWaypoints,
      parentOffset
    );

    // Normalize bounds to start from padding position
    normalizeBounds(elementBounds, flowWaypoints, padding);

    console.log("📊 Collected bounds for", elementBounds.size, "elements");
    console.log("📊 Collected waypoints for", flowWaypoints.size, "flows");

    // Start building XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="${definitionsId}" targetNamespace="http://bpmn.io/schema/bpmn" exporter="edu-rpa" exporterVersion="1.0">
  <bpmn:process id="${processId}" isExecutable="false">
`;

    // Generate BPMN elements recursively
    xml += generateFlowElementsXml(flowElements, "    ");

    xml += `  </bpmn:process>
`;

    // Generate BPMN DI (Diagram Interchange)
    xml += `  <bpmndi:BPMNDiagram id="${diagramId}">
    <bpmndi:BPMNPlane id="${planeId}" bpmnElement="${processId}">
`;

    // Generate shapes recursively
    xml += generateDiShapes(flowElements, elementBounds, "      ");

    // Generate edges recursively with waypoints
    xml += generateDiEdges(
      flowElements,
      elementBounds,
      flowWaypoints,
      "      "
    );

    xml += `    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`;

    console.log("✅ Extraction complete with nested subprocess support");

    // Apply auto-layout if requested
    if (useAutoLayout) {
      console.log("🔄 Applying bpmn-auto-layout...");
      try {
        xml = await layoutProcess(xml);
        console.log("✅ Auto-layout applied successfully");
      } catch (layoutError) {
        console.warn(
          "⚠️ Auto-layout failed, using original positions:",
          layoutError
        );
      }
    }

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

/**
 * Extract subprocess with auto-layout applied
 * Convenience wrapper that always applies bpmn-auto-layout
 */
export async function extractSubProcessWithAutoLayout(
  modeler: any,
  subProcessId: string
): Promise<ExtractedSubProcess> {
  return extractSubProcessAsProcess(modeler, subProcessId, {
    useAutoLayout: true,
  });
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
