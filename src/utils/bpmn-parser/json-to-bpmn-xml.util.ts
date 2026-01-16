/**
 * JSON to BPMN XML Converter
 * Converts a structured JSON object with BPMN nodes and flows into valid BPMN 2.0 XML
 * that can be rendered and edited by bpmn-js modeler.
 *
 * Also generates activities list compatible with the RPA system.
 */

import { Activity } from "@/types/activity";
import { Variable, VariableType } from "@/types/variable";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface BpmnNodeMapping {
  is_automatic: boolean;
  bot_id?: string;
  manual_review: boolean;
}

export interface BpmnNodeJson {
  id: string;
  type: BpmnNodeType;
  name: string;
  mapping?: BpmnNodeMapping;
  in_loop?: boolean;
}

export interface BpmnFlowJson {
  source: string;
  target: string;
  type: "SequenceFlow";
  condition: string | null;
}

export interface ActivityMappingCandidate {
  activity_id: string;
  score: number;
}

export interface ActivityMapping {
  node_id: string;
  activity_id: string;
  confidence: number;
  manual_review: boolean;
  is_automatic?: boolean;
  type: string;
  candidates: ActivityMappingCandidate[];
  input_bindings: Record<string, unknown>;
  outputs: unknown[];
}

export interface BpmnJsonData {
  bpmn: {
    nodes: BpmnNodeJson[];
    flows: BpmnFlowJson[];
  };
  mapping?: ActivityMapping[];
}

export type BpmnNodeType =
  | "StartEvent"
  | "EndEvent"
  | "Task"
  | "UserTask"
  | "ServiceTask"
  | "ManualTask"
  | "SendTask"
  | "ReceiveTask"
  | "ScriptTask"
  | "BusinessRuleTask"
  | "ExclusiveGateway"
  | "ParallelGateway"
  | "InclusiveGateway"
  | "SubProcess";

// Shape dimensions for different BPMN element types
const SHAPE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  StartEvent: { width: 36, height: 36 },
  EndEvent: { width: 36, height: 36 },
  Task: { width: 100, height: 80 },
  UserTask: { width: 100, height: 80 },
  ServiceTask: { width: 100, height: 80 },
  ManualTask: { width: 100, height: 80 },
  SendTask: { width: 100, height: 80 },
  ReceiveTask: { width: 100, height: 80 },
  ScriptTask: { width: 100, height: 80 },
  BusinessRuleTask: { width: 100, height: 80 },
  ExclusiveGateway: { width: 50, height: 50 },
  ParallelGateway: { width: 50, height: 50 },
  InclusiveGateway: { width: 50, height: 50 },
  SubProcess: { width: 350, height: 200 },
};

// =============================================================================
// IMPROVED LAYOUT ALGORITHM
// =============================================================================

interface NodePosition {
  x: number;
  y: number;
}

interface LayoutResult {
  positions: Map<string, NodePosition>;
  waypoints: Map<string, Array<{ x: number; y: number }>>;
}

interface LayoutOptions {
  horizontalSpacing?: number;
  verticalSpacing?: number;
  startX?: number;
  startY?: number;
  branchSpacing?: number;
}

const DEFAULT_LAYOUT_OPTIONS: Required<LayoutOptions> = {
  horizontalSpacing: 180,
  verticalSpacing: 120,
  startX: 200,
  startY: 200,
  branchSpacing: 140,
};

/**
 * Improved auto-layout algorithm with better branch handling
 * - Uses Sugiyama-style layer assignment
 * - Handles gateway branching with proper Y-offset
 * - Avoids element overlapping
 */
function calculateLayout(
  nodes: BpmnNodeJson[],
  flows: BpmnFlowJson[],
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  const positions = new Map<string, NodePosition>();
  const waypoints = new Map<string, Array<{ x: number; y: number }>>();

  // Build adjacency lists
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  nodes.forEach((node) => {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
    inDegree.set(node.id, 0);
    outDegree.set(node.id, 0);
  });

  flows.forEach((flow) => {
    outgoing.get(flow.source)?.push(flow.target);
    incoming.get(flow.target)?.push(flow.source);
    inDegree.set(flow.target, (inDegree.get(flow.target) || 0) + 1);
    outDegree.set(flow.source, (outDegree.get(flow.source) || 0) + 1);
  });

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Identify gateways (split/join points)
  const splitGateways = new Set<string>();
  const joinGateways = new Set<string>();

  nodes.forEach((node) => {
    if (node.type.includes("Gateway")) {
      const out = outDegree.get(node.id) || 0;
      const inp = inDegree.get(node.id) || 0;
      if (out > 1) splitGateways.add(node.id);
      if (inp > 1) joinGateways.add(node.id);
    }
  });

  // Layer assignment using BFS from start nodes
  const layers: string[][] = [];
  const nodeLayer = new Map<string, number>();
  const visited = new Set<string>();

  // Find start nodes (no incoming edges)
  let currentLayer = nodes
    .filter((n) => (inDegree.get(n.id) || 0) === 0)
    .map((n) => n.id);

  let layerIndex = 0;
  while (currentLayer.length > 0) {
    layers.push([...currentLayer]);
    currentLayer.forEach((nodeId) => {
      visited.add(nodeId);
      nodeLayer.set(nodeId, layerIndex);
    });

    const nextLayer: string[] = [];
    currentLayer.forEach((nodeId) => {
      outgoing.get(nodeId)?.forEach((targetId) => {
        if (!visited.has(targetId) && !nextLayer.includes(targetId)) {
          // For non-join nodes, add immediately
          // For join nodes, wait until all predecessors are visited
          const isJoin = joinGateways.has(targetId);
          if (isJoin) {
            const allPredecessorsVisited = incoming
              .get(targetId)
              ?.every((pred) => visited.has(pred));
            if (allPredecessorsVisited) {
              nextLayer.push(targetId);
            }
          } else {
            nextLayer.push(targetId);
          }
        }
      });
    });

    currentLayer = nextLayer;
    layerIndex++;

    // Safety check to prevent infinite loops
    if (layerIndex > nodes.length * 2) break;
  }

  // Handle remaining nodes (cycles or disconnected)
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      // Try to find best layer based on predecessors
      const preds = incoming.get(node.id) || [];
      let maxPredLayer = -1;
      preds.forEach((pred) => {
        const predLayer = nodeLayer.get(pred);
        if (predLayer !== undefined && predLayer > maxPredLayer) {
          maxPredLayer = predLayer;
        }
      });

      const targetLayer = maxPredLayer + 1;
      if (!layers[targetLayer]) {
        layers[targetLayer] = [];
      }
      layers[targetLayer].push(node.id);
      nodeLayer.set(node.id, targetLayer);
      visited.add(node.id);
    }
  });

  // Track branch paths for Y-positioning
  // Each node gets a "branch index" based on which path from gateway it's on
  const nodeBranchIndex = new Map<string, number>();

  // Trace branches from split gateways
  splitGateways.forEach((gatewayId) => {
    const targets = outgoing.get(gatewayId) || [];
    targets.forEach((targetId, branchIdx) => {
      // BFS to assign branch index to all nodes in this branch until join
      const queue = [targetId];
      const branchVisited = new Set<string>();

      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (branchVisited.has(nodeId) || joinGateways.has(nodeId)) continue;
        branchVisited.add(nodeId);

        // Only set if not already set (first branch wins)
        if (!nodeBranchIndex.has(nodeId)) {
          nodeBranchIndex.set(nodeId, branchIdx);
        }

        const nextNodes = outgoing.get(nodeId) || [];
        nextNodes.forEach((next) => {
          if (!branchVisited.has(next)) {
            queue.push(next);
          }
        });
      }
    });
  });

  // Calculate positions with improved Y-spacing
  layers.forEach((layer, layerIdx) => {
    // Sort nodes in layer by branch index for consistent ordering
    layer.sort((a, b) => {
      const branchA = nodeBranchIndex.get(a) ?? 0;
      const branchB = nodeBranchIndex.get(b) ?? 0;
      return branchA - branchB;
    });

    // Calculate vertical positions
    const layerHeight = layer.length * opts.branchSpacing;
    const startY = opts.startY - layerHeight / 2 + opts.branchSpacing / 2;

    layer.forEach((nodeId, nodeIdx) => {
      const node = nodeById.get(nodeId);
      if (!node) return;

      const x = opts.startX + layerIdx * opts.horizontalSpacing;

      // Use branch index for Y if available, otherwise use layer position
      const branchIdx = nodeBranchIndex.get(nodeId);
      let y: number;

      if (branchIdx !== undefined && layer.length > 1) {
        // Offset based on branch index
        y = opts.startY + branchIdx * opts.branchSpacing;
      } else if (layer.length === 1) {
        // Single node in layer - center it
        y = opts.startY;
      } else {
        // Multiple nodes without branch info - spread vertically
        y = startY + nodeIdx * opts.branchSpacing;
      }

      positions.set(nodeId, { x, y });
    });
  });

  // Ensure join gateways are centered between their incoming branches
  joinGateways.forEach((gatewayId) => {
    const preds = incoming.get(gatewayId) || [];
    if (preds.length > 1) {
      let minY = Infinity;
      let maxY = -Infinity;

      preds.forEach((predId) => {
        const predPos = positions.get(predId);
        if (predPos) {
          minY = Math.min(minY, predPos.y);
          maxY = Math.max(maxY, predPos.y);
        }
      });

      const gatewayPos = positions.get(gatewayId);
      if (gatewayPos && minY !== Infinity) {
        gatewayPos.y = (minY + maxY) / 2;
      }
    }
  });

  // Calculate waypoints for flows with improved routing
  flows.forEach((flow) => {
    const sourceNode = nodeById.get(flow.source);
    const targetNode = nodeById.get(flow.target);
    const sourcePos = positions.get(flow.source);
    const targetPos = positions.get(flow.target);

    if (!sourceNode || !targetNode || !sourcePos || !targetPos) return;

    const sourceDims = SHAPE_DIMENSIONS[sourceNode.type] || {
      width: 100,
      height: 80,
    };
    const targetDims = SHAPE_DIMENSIONS[targetNode.type] || {
      width: 100,
      height: 80,
    };

    // Calculate connection points
    const startX = sourcePos.x + sourceDims.width;
    const startY = sourcePos.y + sourceDims.height / 2;
    const endX = targetPos.x;
    const endY = targetPos.y + targetDims.height / 2;

    const flowWaypoints: Array<{ x: number; y: number }> = [];

    // Determine if this is a branch flow (from split gateway)
    const isFromSplitGateway = splitGateways.has(flow.source);
    const isToJoinGateway = joinGateways.has(flow.target);
    const needsRouting = Math.abs(endY - startY) > 30 || endX <= startX;

    if (isFromSplitGateway && needsRouting) {
      // Route from gateway: go right first, then vertical, then to target
      const midX = startX + 40;
      flowWaypoints.push(
        { x: startX, y: startY },
        { x: midX, y: startY },
        { x: midX, y: endY },
        { x: endX, y: endY }
      );
    } else if (isToJoinGateway && needsRouting) {
      // Route to join gateway: go horizontal then vertical to gateway
      const midX = endX - 40;
      flowWaypoints.push(
        { x: startX, y: startY },
        { x: midX, y: startY },
        { x: midX, y: endY },
        { x: endX, y: endY }
      );
    } else if (needsRouting) {
      // General case with vertical difference
      const midX = (startX + endX) / 2;
      flowWaypoints.push(
        { x: startX, y: startY },
        { x: midX, y: startY },
        { x: midX, y: endY },
        { x: endX, y: endY }
      );
    } else {
      // Simple straight line
      flowWaypoints.push({ x: startX, y: startY }, { x: endX, y: endY });
    }

    waypoints.set(`Flow_${flow.source}_${flow.target}`, flowWaypoints);
  });

  return { positions, waypoints };
}

// =============================================================================
// SUBPROCESS GROUPING
// =============================================================================

interface SubProcessGroup {
  id: string;
  name: string;
  nodes: BpmnNodeJson[];
  internalFlows: BpmnFlowJson[];
  startNodeId: string;
  endNodeId: string;
  // Nested subprocesses for in_loop nodes within this subprocess
  nestedSubProcesses?: Map<string, SubProcessGroup>;
  // Track which original nodes are replaced by nested subprocesses
  nodeToNestedSubProcess?: Map<string, string>;
}

interface ProcessedBpmn {
  nodes: BpmnNodeJson[];
  flows: BpmnFlowJson[];
  subProcesses: Map<string, SubProcessGroup>;
}

/**
 * Extract automatic node IDs from mapping data
 * Handles both array format and object format of mapping
 */
function extractAutomaticNodeIdsFromMapping(mappings?: any[]): Set<string> {
  const automaticNodeIds = new Set<string>();

  if (!mappings) return automaticNodeIds;

  // Parse mapping - can be array of objects where values are mapping entries
  const entries: any[] = Array.isArray(mappings)
    ? mappings.flatMap((item: any) => {
        if (typeof item === "object" && item !== null) {
          // Check if item has node_id directly (flat array)
          if (item.node_id !== undefined) {
            return [item];
          }
          // Otherwise, extract values from nested object
          return Object.values(item);
        }
        return [];
      })
    : Object.values(mappings);

  entries.forEach((entry: any) => {
    if (
      entry &&
      entry.is_automatic === true &&
      typeof entry.node_id === "string"
    ) {
      automaticNodeIds.add(entry.node_id);
    }
  });

  return automaticNodeIds;
}

/**
 * Group in_loop nodes within a subprocess into nested subprocesses
 * Simply groups nodes with in_loop=TRUE - no automatic gateway detection
 *
 * Flow redirection logic:
 * - Flows from external nodes TO in_loop nodes → redirect TO subprocess
 * - Flows from in_loop nodes TO external nodes → redirect FROM subprocess
 * - Flows between in_loop nodes → become internal flows of nested subprocess
 */
function groupInLoopNodesIntoNestedSubProcesses(
  subProcess: SubProcessGroup
): SubProcessGroup {
  const { nodes, internalFlows } = subProcess;

  // Find nodes with in_loop=true
  const inLoopNodeIds = new Set<string>();
  nodes.forEach((node) => {
    if (node.in_loop === true) {
      inLoopNodeIds.add(node.id);
    }
  });

  // If no in_loop nodes, return unchanged
  if (inLoopNodeIds.size === 0) {
    return subProcess;
  }

  // Build adjacency map for internal flows
  const flowMap = new Map<string, string[]>();
  const reverseFlowMap = new Map<string, string[]>();

  internalFlows.forEach((flow) => {
    if (!flowMap.has(flow.source)) flowMap.set(flow.source, []);
    flowMap.get(flow.source)!.push(flow.target);

    if (!reverseFlowMap.has(flow.target)) reverseFlowMap.set(flow.target, []);
    reverseFlowMap.get(flow.target)!.push(flow.source);
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const nestedSubProcesses = new Map<string, SubProcessGroup>();
  const nodeToNestedSubProcess = new Map<string, string>();

  // Find connected components of in_loop nodes
  inLoopNodeIds.forEach((startNodeId) => {
    if (visited.has(startNodeId)) return;

    // BFS to find all connected in_loop nodes
    const component: string[] = [];
    const componentSet = new Set<string>();
    const queue = [startNodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId) || componentSet.has(currentId)) continue;
      if (!inLoopNodeIds.has(currentId)) continue;

      visited.add(currentId);
      componentSet.add(currentId);
      component.push(currentId);

      // Check neighbors in both directions
      const outNeighbors = flowMap.get(currentId) || [];
      const inNeighbors = reverseFlowMap.get(currentId) || [];

      [...outNeighbors, ...inNeighbors].forEach((neighborId) => {
        if (!visited.has(neighborId) && inLoopNodeIds.has(neighborId)) {
          queue.push(neighborId);
        }
      });
    }

    // Create nested subprocess for this component
    if (component.length > 0) {
      const componentNodes = component
        .map((id) => nodeMap.get(id)!)
        .filter(Boolean);
      const nestedSubProcessId = `SubProcess_loop_${Date.now().toString(
        36
      )}_${Math.random().toString(36).substring(2, 7)}`;
      const nestedStartEventId = `${nestedSubProcessId}_Start`;
      const nestedEndEventId = `${nestedSubProcessId}_End`;

      // Find internal flows within the nested component (between in_loop nodes only)
      const nestedInternalFlows: BpmnFlowJson[] = [];
      internalFlows.forEach((flow) => {
        if (componentSet.has(flow.source) && componentSet.has(flow.target)) {
          nestedInternalFlows.push(flow);
        }
      });

      // Generate nested subprocess name
      const nestedSubProcessName =
        componentNodes.length === 1
          ? `Loop: ${componentNodes[0].name || componentNodes[0].id}`
          : `Loop: ${componentNodes.map((n) => n.name || n.id).join(", ")}`;

      nestedSubProcesses.set(nestedSubProcessId, {
        id: nestedSubProcessId,
        name: nestedSubProcessName,
        nodes: componentNodes,
        internalFlows: nestedInternalFlows,
        startNodeId: nestedStartEventId,
        endNodeId: nestedEndEventId,
      });

      // Track mapping from original nodes to nested subprocess
      component.forEach((id) => {
        nodeToNestedSubProcess.set(id, nestedSubProcessId);
      });
    }
  });

  // If no nested subprocesses were created, return unchanged
  if (nestedSubProcesses.size === 0) {
    return subProcess;
  }

  // Build new nodes list (replace in_loop nodes with nested subprocess nodes)
  const newNodes: BpmnNodeJson[] = [];
  const addedNestedSubProcessIds = new Set<string>();

  nodes.forEach((node) => {
    if (nodeToNestedSubProcess.has(node.id)) {
      // This node is part of a nested subprocess
      const nestedSubProcessId = nodeToNestedSubProcess.get(node.id);
      if (
        nestedSubProcessId &&
        !addedNestedSubProcessIds.has(nestedSubProcessId)
      ) {
        // Add the nested subprocess node instead (only once)
        const nestedSubProcess = nestedSubProcesses.get(nestedSubProcessId)!;
        newNodes.push({
          id: nestedSubProcessId,
          type: "SubProcess",
          name: nestedSubProcess.name,
          in_loop: true, // Mark as loop subprocess
        });
        addedNestedSubProcessIds.add(nestedSubProcessId);
      }
    } else {
      // Keep non-in_loop nodes
      newNodes.push(node);
    }
  });

  // Process flows - redirect flows that cross subprocess boundary
  const newInternalFlows: BpmnFlowJson[] = [];
  const addedFlowKeys = new Set<string>();

  internalFlows.forEach((flow) => {
    const sourceInLoop = nodeToNestedSubProcess.has(flow.source);
    const targetInLoop = nodeToNestedSubProcess.has(flow.target);

    // Case 1: Both source and target are in_loop nodes (same or different subprocess)
    if (sourceInLoop && targetInLoop) {
      const sourceSubProcess = nodeToNestedSubProcess.get(flow.source);
      const targetSubProcess = nodeToNestedSubProcess.get(flow.target);

      if (sourceSubProcess === targetSubProcess) {
        // Internal flow within same nested subprocess - already captured in nestedInternalFlows
        // Skip adding to parent flows
        return;
      } else {
        // Flow between different nested subprocesses - redirect both ends
        const newSource = sourceSubProcess!;
        const newTarget = targetSubProcess!;
        const newFlowKey = `${newSource}_${newTarget}`;

        if (!addedFlowKeys.has(newFlowKey) && newSource !== newTarget) {
          addedFlowKeys.add(newFlowKey);
          newInternalFlows.push({
            ...flow,
            source: newSource,
            target: newTarget,
          });
        }
      }
    }
    // Case 2: Source is in_loop, target is not → flow exits subprocess
    else if (sourceInLoop && !targetInLoop) {
      const newSource = nodeToNestedSubProcess.get(flow.source)!;
      const newFlowKey = `${newSource}_${flow.target}`;

      if (!addedFlowKeys.has(newFlowKey)) {
        addedFlowKeys.add(newFlowKey);
        newInternalFlows.push({
          ...flow,
          source: newSource,
          target: flow.target,
        });
      }
    }
    // Case 3: Source is not in_loop, target is in_loop → flow enters subprocess
    else if (!sourceInLoop && targetInLoop) {
      const newTarget = nodeToNestedSubProcess.get(flow.target)!;
      const newFlowKey = `${flow.source}_${newTarget}`;

      if (!addedFlowKeys.has(newFlowKey)) {
        addedFlowKeys.add(newFlowKey);
        newInternalFlows.push({
          ...flow,
          source: flow.source,
          target: newTarget,
        });
      }
    }
    // Case 4: Neither source nor target is in_loop → keep as is
    else {
      const newFlowKey = `${flow.source}_${flow.target}`;
      if (!addedFlowKeys.has(newFlowKey)) {
        addedFlowKeys.add(newFlowKey);
        newInternalFlows.push(flow);
      }
    }
  });

  return {
    ...subProcess,
    nodes: newNodes,
    internalFlows: newInternalFlows,
    nestedSubProcesses,
    nodeToNestedSubProcess,
  };
}

/**
 * Groups nodes with is_automatic=true from mapping into subprocesses
 * - Consecutive automatic nodes (connected by sequenceFlow) form one subprocess
 * - Single automatic nodes also form their own subprocess
 * - Each subprocess has auto-generated start/end events
 */
function groupNodesIntoSubProcesses(
  nodes: BpmnNodeJson[],
  flows: BpmnFlowJson[],
  mappings?: any[]
): ProcessedBpmn {
  // Extract automatic node IDs from mapping
  const automaticNodeIds = extractAutomaticNodeIdsFromMapping(mappings);

  // If no automatic nodes, return unchanged
  if (automaticNodeIds.size === 0) {
    return { nodes, flows, subProcesses: new Map() };
  }

  // Build adjacency map
  const flowMap = new Map<string, string[]>();
  const reverseFlowMap = new Map<string, string[]>();

  flows.forEach((flow) => {
    if (!flowMap.has(flow.source)) flowMap.set(flow.source, []);
    flowMap.get(flow.source)!.push(flow.target);

    if (!reverseFlowMap.has(flow.target)) reverseFlowMap.set(flow.target, []);
    reverseFlowMap.get(flow.target)!.push(flow.source);
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const subProcesses = new Map<string, SubProcessGroup>();
  const nodesToRemove = new Set<string>();
  const flowsToRemove = new Set<string>();
  // Track original node IDs for each subprocess (before in_loop grouping modifies nodes)
  const subProcessOriginalNodeIds = new Map<string, Set<string>>();

  // Find connected components of automatic nodes
  automaticNodeIds.forEach((startNodeId) => {
    if (visited.has(startNodeId)) return;
    if (!nodeMap.has(startNodeId)) return; // Node doesn't exist in BPMN

    // BFS to find all connected automatic nodes
    const component: string[] = [];
    const componentSet = new Set<string>();
    const queue = [startNodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId) || componentSet.has(currentId)) continue;
      if (!automaticNodeIds.has(currentId)) continue;
      if (!nodeMap.has(currentId)) continue;

      visited.add(currentId);
      componentSet.add(currentId);
      component.push(currentId);

      // Check neighbors in both directions (following sequence flows)
      const outNeighbors = flowMap.get(currentId) || [];
      const inNeighbors = reverseFlowMap.get(currentId) || [];

      [...outNeighbors, ...inNeighbors].forEach((neighborId) => {
        if (
          !visited.has(neighborId) &&
          automaticNodeIds.has(neighborId) &&
          nodeMap.has(neighborId)
        ) {
          queue.push(neighborId);
        }
      });
    }

    // Create subprocess for this component (even if single node)
    if (component.length > 0) {
      const componentNodes = component
        .map((id) => nodeMap.get(id)!)
        .filter(Boolean);
      const subProcessId = `SubProcess_auto_${Date.now().toString(
        36
      )}_${Math.random().toString(36).substring(2, 7)}`;
      const startEventId = `${subProcessId}_Start`;
      const endEventId = `${subProcessId}_End`;

      // Find internal flows (both source and target in component)
      const internalFlows: BpmnFlowJson[] = [];
      flows.forEach((flow) => {
        if (componentSet.has(flow.source) && componentSet.has(flow.target)) {
          internalFlows.push(flow);
          flowsToRemove.add(`${flow.source}_${flow.target}`);
        }
      });

      // Find entry node (node with external incoming flow or no internal incoming)
      let entryNodeId = component[0];
      for (const nodeId of component) {
        const incoming = reverseFlowMap.get(nodeId) || [];
        const hasExternalIncoming = incoming.some(
          (src) => !componentSet.has(src)
        );
        const hasNoInternalIncoming = !incoming.some((src) =>
          componentSet.has(src)
        );
        if (
          hasExternalIncoming ||
          (hasNoInternalIncoming && incoming.length > 0)
        ) {
          entryNodeId = nodeId;
          break;
        }
      }

      // Find exit node (node with external outgoing flow or no internal outgoing)
      let exitNodeId = component[component.length - 1];
      for (const nodeId of component) {
        const outgoing = flowMap.get(nodeId) || [];
        const hasExternalOutgoing = outgoing.some(
          (tgt) => !componentSet.has(tgt)
        );
        const hasNoInternalOutgoing = !outgoing.some((tgt) =>
          componentSet.has(tgt)
        );
        if (
          hasExternalOutgoing ||
          (hasNoInternalOutgoing && outgoing.length > 0)
        ) {
          exitNodeId = nodeId;
          break;
        }
      }

      // Generate subprocess name
      const subProcessName =
        componentNodes.length === 1
          ? `Auto: ${componentNodes[0].name || componentNodes[0].id}`
          : `Auto: ${componentNodes.map((n) => n.name || n.id).join(", ")}`;

      // Create initial subprocess
      let subProcess: SubProcessGroup = {
        id: subProcessId,
        name: subProcessName,
        nodes: componentNodes,
        internalFlows,
        startNodeId: startEventId,
        endNodeId: endEventId,
      };

      // Process in_loop nodes within this subprocess to create nested subprocesses
      subProcess = groupInLoopNodesIntoNestedSubProcesses(subProcess);

      subProcesses.set(subProcessId, subProcess);

      // Mark nodes for removal from main process
      component.forEach((id) => nodesToRemove.add(id));

      // Track original node IDs for this subprocess (for flow redirection)
      subProcessOriginalNodeIds.set(subProcessId, componentSet);
    }
  });

  // Build new nodes and flows lists
  const newNodes: BpmnNodeJson[] = [];
  const newFlows: BpmnFlowJson[] = [];

  // Add nodes that are not in subprocesses
  nodes.forEach((node) => {
    if (!nodesToRemove.has(node.id)) {
      newNodes.push(node);
    }
  });

  // Add subprocess nodes
  subProcesses.forEach((subProcess) => {
    newNodes.push({
      id: subProcess.id,
      type: "SubProcess",
      name: subProcess.name,
    });
  });

  // Update flows - redirect flows that cross subprocess boundary
  const addedFlowKeys = new Set<string>();

  flows.forEach((flow) => {
    const flowKey = `${flow.source}_${flow.target}`;

    // Skip internal subprocess flows (they'll be inside subprocess)
    if (flowsToRemove.has(flowKey)) return;

    let newSource = flow.source;
    let newTarget = flow.target;
    let sourceSubProcessId: string | null = null;
    let targetSubProcessId: string | null = null;

    // Check if source/target is in a subprocess using ORIGINAL node IDs
    subProcessOriginalNodeIds.forEach((originalNodeIds, subProcessId) => {
      if (originalNodeIds.has(flow.source)) {
        sourceSubProcessId = subProcessId;
      }
      if (originalNodeIds.has(flow.target)) {
        targetSubProcessId = subProcessId;
      }
    });

    // Case 1: Both in same subprocess - internal flow (should be in flowsToRemove already)
    if (
      sourceSubProcessId &&
      targetSubProcessId &&
      sourceSubProcessId === targetSubProcessId
    ) {
      // This is an internal flow, skip it
      return;
    }

    // Case 2: Source in subprocess, target not (or in different subprocess) - flow exits
    if (
      sourceSubProcessId &&
      (!targetSubProcessId || sourceSubProcessId !== targetSubProcessId)
    ) {
      newSource = sourceSubProcessId;
    }

    // Case 3: Target in subprocess, source not (or in different subprocess) - flow enters
    if (
      targetSubProcessId &&
      (!sourceSubProcessId || sourceSubProcessId !== targetSubProcessId)
    ) {
      newTarget = targetSubProcessId;
    }

    // Avoid duplicate flows and self-loops
    const newFlowKey = `${newSource}_${newTarget}`;
    if (addedFlowKeys.has(newFlowKey) || newSource === newTarget) {
      return;
    }

    addedFlowKeys.add(newFlowKey);
    newFlows.push({
      ...flow,
      source: newSource,
      target: newTarget,
    });
  });

  return { nodes: newNodes, flows: newFlows, subProcesses };
}

// =============================================================================
// XML GENERATION
// =============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateProcessId(): string {
  return `Process_${Date.now().toString(36)}`;
}

function getBpmnElementName(type: BpmnNodeType): string {
  const typeMap: Record<BpmnNodeType, string> = {
    StartEvent: "bpmn:startEvent",
    EndEvent: "bpmn:endEvent",
    Task: "bpmn:task",
    UserTask: "bpmn:userTask",
    ServiceTask: "bpmn:serviceTask",
    ManualTask: "bpmn:manualTask",
    SendTask: "bpmn:sendTask",
    ReceiveTask: "bpmn:receiveTask",
    ScriptTask: "bpmn:scriptTask",
    BusinessRuleTask: "bpmn:businessRuleTask",
    ExclusiveGateway: "bpmn:exclusiveGateway",
    ParallelGateway: "bpmn:parallelGateway",
    InclusiveGateway: "bpmn:inclusiveGateway",
    SubProcess: "bpmn:subProcess",
  };
  return typeMap[type] || "bpmn:task";
}

function generateFlowId(source: string, target: string): string {
  return `Flow_${source}_${target}`;
}

function buildFlowReferences(
  nodeId: string,
  flows: BpmnFlowJson[]
): { incoming: string[]; outgoing: string[] } {
  const incoming: string[] = [];
  const outgoing: string[] = [];

  flows.forEach((flow) => {
    const flowId = generateFlowId(flow.source, flow.target);
    if (flow.source === nodeId) {
      outgoing.push(flowId);
    }
    if (flow.target === nodeId) {
      incoming.push(flowId);
    }
  });

  return { incoming, outgoing };
}

/**
 * Generate XML for nested subprocess content (in_loop subprocesses)
 */
function generateNestedSubProcessContent(
  nestedSubProcess: SubProcessGroup,
  indent: string = "          "
): string {
  let xml = "";

  // Add start event
  const startFlowId = `${nestedSubProcess.startNodeId}_to_first`;
  xml += `${indent}<bpmn:startEvent id="${nestedSubProcess.startNodeId}" name="Start">\n`;
  xml += `${indent}  <bpmn:outgoing>${startFlowId}</bpmn:outgoing>\n`;
  xml += `${indent}</bpmn:startEvent>\n`;

  // Find first node (entry point)
  let firstNodeId = nestedSubProcess.nodes[0]?.id;
  for (const node of nestedSubProcess.nodes) {
    const hasInternalIncoming = nestedSubProcess.internalFlows.some(
      (f) => f.target === node.id
    );
    if (!hasInternalIncoming) {
      firstNodeId = node.id;
      break;
    }
  }

  // Find last node (exit point)
  let lastNodeId =
    nestedSubProcess.nodes[nestedSubProcess.nodes.length - 1]?.id;
  for (const node of nestedSubProcess.nodes) {
    const hasInternalOutgoing = nestedSubProcess.internalFlows.some(
      (f) => f.source === node.id
    );
    if (!hasInternalOutgoing) {
      lastNodeId = node.id;
      break;
    }
  }

  const endFlowId = `last_to_${nestedSubProcess.endNodeId}`;

  // Generate nested subprocess nodes
  nestedSubProcess.nodes.forEach((node) => {
    const elementName = getBpmnElementName(node.type);
    const nameAttr = node.name ? ` name="${escapeXml(node.name)}"` : "";

    xml += `${indent}<${elementName} id="${node.id}"${nameAttr}>\n`;

    // Incoming flows
    if (node.id === firstNodeId) {
      xml += `${indent}  <bpmn:incoming>${startFlowId}</bpmn:incoming>\n`;
    }
    nestedSubProcess.internalFlows.forEach((flow) => {
      if (flow.target === node.id) {
        const flowId = generateFlowId(flow.source, flow.target);
        xml += `${indent}  <bpmn:incoming>${flowId}</bpmn:incoming>\n`;
      }
    });

    // Outgoing flows
    if (node.id === lastNodeId) {
      xml += `${indent}  <bpmn:outgoing>${endFlowId}</bpmn:outgoing>\n`;
    }
    nestedSubProcess.internalFlows.forEach((flow) => {
      if (flow.source === node.id) {
        const flowId = generateFlowId(flow.source, flow.target);
        xml += `${indent}  <bpmn:outgoing>${flowId}</bpmn:outgoing>\n`;
      }
    });

    xml += `${indent}</${elementName}>\n`;
  });

  // Add end event
  xml += `${indent}<bpmn:endEvent id="${nestedSubProcess.endNodeId}" name="End">\n`;
  xml += `${indent}  <bpmn:incoming>${endFlowId}</bpmn:incoming>\n`;
  xml += `${indent}</bpmn:endEvent>\n`;

  // Generate internal flows
  xml += `${indent}<bpmn:sequenceFlow id="${startFlowId}" sourceRef="${nestedSubProcess.startNodeId}" targetRef="${firstNodeId}" />\n`;

  nestedSubProcess.internalFlows.forEach((flow) => {
    const flowId = generateFlowId(flow.source, flow.target);
    const nameAttr = flow.condition
      ? ` name="${escapeXml(flow.condition)}"`
      : "";

    xml += `${indent}<bpmn:sequenceFlow id="${flowId}" sourceRef="${flow.source}" targetRef="${flow.target}"${nameAttr}`;

    if (flow.condition) {
      xml += `>\n`;
      xml += `${indent}  <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(
        flow.condition
      )}</bpmn:conditionExpression>\n`;
      xml += `${indent}</bpmn:sequenceFlow>\n`;
    } else {
      xml += ` />\n`;
    }
  });

  xml += `${indent}<bpmn:sequenceFlow id="${endFlowId}" sourceRef="${lastNodeId}" targetRef="${nestedSubProcess.endNodeId}" />\n`;

  return xml;
}

/**
 * Generate XML for subprocess content
 * Supports nested subprocesses for in_loop nodes
 */
function generateSubProcessContent(
  subProcess: SubProcessGroup,
  allFlows: BpmnFlowJson[]
): string {
  let xml = "";

  // Add start event
  const startFlowId = `${subProcess.startNodeId}_to_first`;
  xml += `      <bpmn:startEvent id="${subProcess.startNodeId}" name="Start">\n`;
  xml += `        <bpmn:outgoing>${startFlowId}</bpmn:outgoing>\n`;
  xml += `      </bpmn:startEvent>\n`;

  // Find first node (entry point)
  let firstNodeId = subProcess.nodes[0]?.id;
  for (const node of subProcess.nodes) {
    const hasInternalIncoming = subProcess.internalFlows.some(
      (f) => f.target === node.id
    );
    if (!hasInternalIncoming) {
      firstNodeId = node.id;
      break;
    }
  }

  // Find last node (exit point)
  let lastNodeId = subProcess.nodes[subProcess.nodes.length - 1]?.id;
  for (const node of subProcess.nodes) {
    const hasInternalOutgoing = subProcess.internalFlows.some(
      (f) => f.source === node.id
    );
    if (!hasInternalOutgoing) {
      lastNodeId = node.id;
      break;
    }
  }

  const endFlowId = `last_to_${subProcess.endNodeId}`;

  // Generate subprocess nodes (including nested subprocesses)
  subProcess.nodes.forEach((node) => {
    const nameAttr = node.name ? ` name="${escapeXml(node.name)}"` : "";

    // Check if this node is a nested subprocess (in_loop)
    const nestedSubProcess = subProcess.nestedSubProcesses?.get(node.id);

    if (nestedSubProcess) {
      // Generate nested subprocess with its content
      xml += `      <bpmn:subProcess id="${node.id}"${nameAttr}>\n`;

      // Incoming flows for nested subprocess
      if (node.id === firstNodeId) {
        xml += `        <bpmn:incoming>${startFlowId}</bpmn:incoming>\n`;
      }
      subProcess.internalFlows.forEach((flow) => {
        if (flow.target === node.id) {
          const flowId = generateFlowId(flow.source, flow.target);
          xml += `        <bpmn:incoming>${flowId}</bpmn:incoming>\n`;
        }
      });

      // Outgoing flows for nested subprocess
      if (node.id === lastNodeId) {
        xml += `        <bpmn:outgoing>${endFlowId}</bpmn:outgoing>\n`;
      }
      subProcess.internalFlows.forEach((flow) => {
        if (flow.source === node.id) {
          const flowId = generateFlowId(flow.source, flow.target);
          xml += `        <bpmn:outgoing>${flowId}</bpmn:outgoing>\n`;
        }
      });

      // Generate nested subprocess internal content
      xml += generateNestedSubProcessContent(nestedSubProcess, "        ");

      xml += `      </bpmn:subProcess>\n`;
    } else {
      // Regular node
      const elementName = getBpmnElementName(node.type);
      xml += `      <${elementName} id="${node.id}"${nameAttr}>\n`;

      // Incoming flows
      if (node.id === firstNodeId) {
        xml += `        <bpmn:incoming>${startFlowId}</bpmn:incoming>\n`;
      }
      subProcess.internalFlows.forEach((flow) => {
        if (flow.target === node.id) {
          const flowId = generateFlowId(flow.source, flow.target);
          xml += `        <bpmn:incoming>${flowId}</bpmn:incoming>\n`;
        }
      });

      // Outgoing flows
      if (node.id === lastNodeId) {
        xml += `        <bpmn:outgoing>${endFlowId}</bpmn:outgoing>\n`;
      }
      subProcess.internalFlows.forEach((flow) => {
        if (flow.source === node.id) {
          const flowId = generateFlowId(flow.source, flow.target);
          xml += `        <bpmn:outgoing>${flowId}</bpmn:outgoing>\n`;
        }
      });

      xml += `      </${elementName}>\n`;
    }
  });

  // Add end event
  xml += `      <bpmn:endEvent id="${subProcess.endNodeId}" name="End">\n`;
  xml += `        <bpmn:incoming>${endFlowId}</bpmn:incoming>\n`;
  xml += `      </bpmn:endEvent>\n`;

  // Generate internal flows
  xml += `      <bpmn:sequenceFlow id="${startFlowId}" sourceRef="${subProcess.startNodeId}" targetRef="${firstNodeId}" />\n`;

  subProcess.internalFlows.forEach((flow) => {
    const flowId = generateFlowId(flow.source, flow.target);
    const nameAttr = flow.condition
      ? ` name="${escapeXml(flow.condition)}"`
      : "";

    xml += `      <bpmn:sequenceFlow id="${flowId}" sourceRef="${flow.source}" targetRef="${flow.target}"${nameAttr}`;

    if (flow.condition) {
      xml += `>\n`;
      xml += `        <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(
        flow.condition
      )}</bpmn:conditionExpression>\n`;
      xml += `      </bpmn:sequenceFlow>\n`;
    } else {
      xml += ` />\n`;
    }
  });

  xml += `      <bpmn:sequenceFlow id="${endFlowId}" sourceRef="${lastNodeId}" targetRef="${subProcess.endNodeId}" />\n`;

  return xml;
}

/**
 * Main function to convert JSON to BPMN XML
 */
export function jsonToBpmnXml(
  data: BpmnJsonData,
  layoutOptions?: LayoutOptions
): string {
  const { bpmn, mapping } = data;
  let { nodes, flows } = bpmn;

  // Group nodes with is_automatic=true from mapping into subprocesses
  const processed = groupNodesIntoSubProcesses(nodes, flows, mapping);
  nodes = processed.nodes;
  flows = processed.flows;
  const subProcesses = processed.subProcesses;

  const processId = generateProcessId();
  const definitionsId = `Definitions_${Date.now().toString(36)}`;
  const diagramId = `BPMNDiagram_${Date.now().toString(36)}`;
  const planeId = `BPMNPlane_${Date.now().toString(36)}`;

  // Calculate layout with improved algorithm
  const layout = calculateLayout(nodes, flows, layoutOptions);

  // Build the BPMN XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="${definitionsId}" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="17.0.0">
`;

  xml += `  <bpmn:process id="${processId}" isExecutable="false">\n`;

  // Generate nodes
  nodes.forEach((node) => {
    const elementName = getBpmnElementName(node.type);
    const { incoming, outgoing } = buildFlowReferences(node.id, flows);
    const nameAttr = node.name ? ` name="${escapeXml(node.name)}"` : "";

    // Check if this is a subprocess
    const subProcess = subProcesses.get(node.id);
    if (subProcess) {
      // Generate subprocess with internal content
      xml += `    <bpmn:subProcess id="${node.id}"${nameAttr}>\n`;

      incoming.forEach((flowId) => {
        xml += `      <bpmn:incoming>${flowId}</bpmn:incoming>\n`;
      });

      outgoing.forEach((flowId) => {
        xml += `      <bpmn:outgoing>${flowId}</bpmn:outgoing>\n`;
      });

      // Generate subprocess content
      xml += generateSubProcessContent(subProcess, bpmn.flows);

      xml += `    </bpmn:subProcess>\n`;
    } else {
      // Regular node
      xml += `    <${elementName} id="${node.id}"${nameAttr}>\n`;

      incoming.forEach((flowId) => {
        xml += `      <bpmn:incoming>${flowId}</bpmn:incoming>\n`;
      });

      outgoing.forEach((flowId) => {
        xml += `      <bpmn:outgoing>${flowId}</bpmn:outgoing>\n`;
      });

      xml += `    </${elementName}>\n`;
    }
  });

  // Generate sequence flows
  flows.forEach((flow) => {
    const flowId = generateFlowId(flow.source, flow.target);
    const nameAttr = flow.condition
      ? ` name="${escapeXml(flow.condition)}"`
      : "";

    xml += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${flow.source}" targetRef="${flow.target}"${nameAttr}`;

    if (flow.condition) {
      xml += `>\n`;
      xml += `      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(
        flow.condition
      )}</bpmn:conditionExpression>\n`;
      xml += `    </bpmn:sequenceFlow>\n`;
    } else {
      xml += ` />\n`;
    }
  });

  xml += `  </bpmn:process>\n`;

  // Generate BPMN Diagram
  xml += `  <bpmndi:BPMNDiagram id="${diagramId}">\n`;
  xml += `    <bpmndi:BPMNPlane id="${planeId}" bpmnElement="${processId}">\n`;

  // Generate shapes
  nodes.forEach((node) => {
    const pos = layout.positions.get(node.id);
    if (!pos) return;

    const dims = SHAPE_DIMENSIONS[node.type] || { width: 100, height: 80 };
    const shapeId = `${node.id}_di`;

    const subProcess = subProcesses.get(node.id);
    const isExpanded = subProcess ? "true" : undefined;

    xml += `      <bpmndi:BPMNShape id="${shapeId}" bpmnElement="${node.id}"`;
    if (isExpanded) {
      xml += ` isExpanded="${isExpanded}"`;
    }
    xml += `>\n`;
    xml += `        <dc:Bounds x="${pos.x}" y="${pos.y}" width="${dims.width}" height="${dims.height}" />\n`;

    if (
      node.name &&
      [
        "ExclusiveGateway",
        "ParallelGateway",
        "InclusiveGateway",
        "StartEvent",
        "EndEvent",
      ].includes(node.type)
    ) {
      xml += `        <bpmndi:BPMNLabel>\n`;
      xml += `          <dc:Bounds x="${pos.x - 10}" y="${
        pos.y + dims.height + 5
      }" width="${dims.width + 20}" height="14" />\n`;
      xml += `        </bpmndi:BPMNLabel>\n`;
    }

    xml += `      </bpmndi:BPMNShape>\n`;

    // Generate shapes for subprocess internal elements
    if (subProcess) {
      const subProcessPadding = 20;
      const subProcessInternalWidth = dims.width - 2 * subProcessPadding;
      const subProcessInternalHeight = dims.height - 2 * subProcessPadding;

      // Layout subprocess internal nodes vertically
      const internalNodeCount = subProcess.nodes.length + 2; // +2 for start and end
      const verticalSpacing =
        subProcessInternalHeight / (internalNodeCount + 1);

      // Start event
      const startX = pos.x + subProcessPadding;
      const startY = pos.y + verticalSpacing;
      xml += `      <bpmndi:BPMNShape id="${subProcess.startNodeId}_di" bpmnElement="${subProcess.startNodeId}">\n`;
      xml += `        <dc:Bounds x="${startX}" y="${startY}" width="36" height="36" />\n`;
      xml += `      </bpmndi:BPMNShape>\n`;

      // Internal nodes (including nested subprocesses)
      subProcess.nodes.forEach((internalNode, idx) => {
        // Check if this is a nested subprocess (in_loop)
        const nestedSubProcess = subProcess.nestedSubProcesses?.get(
          internalNode.id
        );

        if (nestedSubProcess) {
          // Nested subprocess shape
          const nestedDims = { width: 200, height: 150 };
          const nestedX = pos.x + (dims.width - nestedDims.width) / 2;
          const nestedY = pos.y + verticalSpacing * (idx + 2);

          xml += `      <bpmndi:BPMNShape id="${internalNode.id}_di" bpmnElement="${internalNode.id}" isExpanded="true">\n`;
          xml += `        <dc:Bounds x="${nestedX}" y="${nestedY}" width="${nestedDims.width}" height="${nestedDims.height}" />\n`;
          xml += `      </bpmndi:BPMNShape>\n`;

          // Generate shapes for nested subprocess internal elements
          const nestedPadding = 15;
          const nestedInternalNodeCount = nestedSubProcess.nodes.length + 2;
          const nestedVerticalSpacing =
            (nestedDims.height - 2 * nestedPadding) /
            (nestedInternalNodeCount + 1);

          // Nested start event
          const nestedStartX = nestedX + nestedPadding;
          const nestedStartY = nestedY + nestedVerticalSpacing;
          xml += `      <bpmndi:BPMNShape id="${nestedSubProcess.startNodeId}_di" bpmnElement="${nestedSubProcess.startNodeId}">\n`;
          xml += `        <dc:Bounds x="${nestedStartX}" y="${nestedStartY}" width="36" height="36" />\n`;
          xml += `      </bpmndi:BPMNShape>\n`;

          // Nested internal nodes
          nestedSubProcess.nodes.forEach((nestedInternalNode, nestedIdx) => {
            const nestedInternalDims = SHAPE_DIMENSIONS[
              nestedInternalNode.type
            ] || {
              width: 80,
              height: 60,
            };
            const nestedInternalX =
              nestedX + (nestedDims.width - nestedInternalDims.width) / 2;
            const nestedInternalY =
              nestedY + nestedVerticalSpacing * (nestedIdx + 2);

            xml += `      <bpmndi:BPMNShape id="${nestedInternalNode.id}_di" bpmnElement="${nestedInternalNode.id}">\n`;
            xml += `        <dc:Bounds x="${nestedInternalX}" y="${nestedInternalY}" width="${nestedInternalDims.width}" height="${nestedInternalDims.height}" />\n`;
            xml += `      </bpmndi:BPMNShape>\n`;
          });

          // Nested end event
          const nestedEndX = nestedX + nestedDims.width - nestedPadding - 36;
          const nestedEndY =
            nestedY + nestedVerticalSpacing * nestedInternalNodeCount;
          xml += `      <bpmndi:BPMNShape id="${nestedSubProcess.endNodeId}_di" bpmnElement="${nestedSubProcess.endNodeId}">\n`;
          xml += `        <dc:Bounds x="${nestedEndX}" y="${nestedEndY}" width="36" height="36" />\n`;
          xml += `      </bpmndi:BPMNShape>\n`;
        } else {
          // Regular internal node
          const internalDims = SHAPE_DIMENSIONS[internalNode.type] || {
            width: 100,
            height: 80,
          };
          const internalX = pos.x + (dims.width - internalDims.width) / 2;
          const internalY = pos.y + verticalSpacing * (idx + 2);

          xml += `      <bpmndi:BPMNShape id="${internalNode.id}_di" bpmnElement="${internalNode.id}">\n`;
          xml += `        <dc:Bounds x="${internalX}" y="${internalY}" width="${internalDims.width}" height="${internalDims.height}" />\n`;
          xml += `      </bpmndi:BPMNShape>\n`;
        }
      });

      // End event
      const endX = pos.x + dims.width - subProcessPadding - 36;
      const endY = pos.y + verticalSpacing * internalNodeCount;
      xml += `      <bpmndi:BPMNShape id="${subProcess.endNodeId}_di" bpmnElement="${subProcess.endNodeId}">\n`;
      xml += `        <dc:Bounds x="${endX}" y="${endY}" width="36" height="36" />\n`;
      xml += `      </bpmndi:BPMNShape>\n`;
    }
  });

  // Generate edges
  flows.forEach((flow) => {
    const flowId = generateFlowId(flow.source, flow.target);
    const points = layout.waypoints.get(flowId) || [];
    const edgeId = `${flowId}_di`;

    xml += `      <bpmndi:BPMNEdge id="${edgeId}" bpmnElement="${flowId}">\n`;

    points.forEach((point) => {
      xml += `        <di:waypoint x="${Math.round(point.x)}" y="${Math.round(
        point.y
      )}" />\n`;
    });

    if (flow.condition) {
      const midX =
        points.length > 0 ? (points[0].x + points[points.length - 1].x) / 2 : 0;
      const midY =
        points.length > 0
          ? (points[0].y + points[points.length - 1].y) / 2 - 15
          : 0;
      xml += `        <bpmndi:BPMNLabel>\n`;
      xml += `          <dc:Bounds x="${Math.round(midX)}" y="${Math.round(
        midY
      )}" width="40" height="14" />\n`;
      xml += `        </bpmndi:BPMNLabel>\n`;
    }

    xml += `      </bpmndi:BPMNEdge>\n`;
  });

  // Generate edges for subprocess internal flows
  subProcesses.forEach((subProcess, subProcessId) => {
    const subProcessPos = layout.positions.get(subProcessId);
    if (!subProcessPos) return;

    const dims = SHAPE_DIMENSIONS["SubProcess"];
    const padding = 20;
    const internalNodeCount = subProcess.nodes.length + 2;
    const verticalSpacing =
      (dims.height - 2 * padding) / (internalNodeCount + 1);

    // Start to first node
    const startFlowId = `${subProcess.startNodeId}_to_first`;
    let firstNodeId = subProcess.nodes[0]?.id;
    for (const node of subProcess.nodes) {
      const hasInternalIncoming = subProcess.internalFlows.some(
        (f) => f.target === node.id
      );
      if (!hasInternalIncoming) {
        firstNodeId = node.id;
        break;
      }
    }

    const startX = subProcessPos.x + padding + 18; // center of start event
    const startY = subProcessPos.y + verticalSpacing + 18;
    const firstNodeDims =
      SHAPE_DIMENSIONS[
        subProcess.nodes.find((n) => n.id === firstNodeId)?.type || "Task"
      ];
    const firstNodeX = subProcessPos.x + (dims.width - firstNodeDims.width) / 2;
    const firstNodeY =
      subProcessPos.y +
      verticalSpacing *
        (subProcess.nodes.findIndex((n) => n.id === firstNodeId) + 2) +
      firstNodeDims.height / 2;

    xml += `      <bpmndi:BPMNEdge id="${startFlowId}_di" bpmnElement="${startFlowId}">\n`;
    xml += `        <di:waypoint x="${Math.round(startX)}" y="${Math.round(
      startY
    )}" />\n`;
    xml += `        <di:waypoint x="${Math.round(firstNodeX)}" y="${Math.round(
      firstNodeY
    )}" />\n`;
    xml += `      </bpmndi:BPMNEdge>\n`;

    // Internal flows
    subProcess.internalFlows.forEach((flow) => {
      const flowId = generateFlowId(flow.source, flow.target);
      const sourceIdx = subProcess.nodes.findIndex((n) => n.id === flow.source);
      const targetIdx = subProcess.nodes.findIndex((n) => n.id === flow.target);

      if (sourceIdx >= 0 && targetIdx >= 0) {
        const sourceDims = SHAPE_DIMENSIONS[subProcess.nodes[sourceIdx].type];
        const targetDims = SHAPE_DIMENSIONS[subProcess.nodes[targetIdx].type];

        const sourceX = subProcessPos.x + (dims.width + sourceDims.width) / 2;
        const sourceY =
          subProcessPos.y +
          verticalSpacing * (sourceIdx + 2) +
          sourceDims.height / 2;
        const targetX = subProcessPos.x + (dims.width - targetDims.width) / 2;
        const targetY =
          subProcessPos.y +
          verticalSpacing * (targetIdx + 2) +
          targetDims.height / 2;

        xml += `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">\n`;
        xml += `        <di:waypoint x="${Math.round(sourceX)}" y="${Math.round(
          sourceY
        )}" />\n`;
        xml += `        <di:waypoint x="${Math.round(targetX)}" y="${Math.round(
          targetY
        )}" />\n`;
        xml += `      </bpmndi:BPMNEdge>\n`;
      }
    });

    // Last node to end
    let lastNodeId = subProcess.nodes[subProcess.nodes.length - 1]?.id;
    for (const node of subProcess.nodes) {
      const hasInternalOutgoing = subProcess.internalFlows.some(
        (f) => f.source === node.id
      );
      if (!hasInternalOutgoing) {
        lastNodeId = node.id;
        break;
      }
    }

    const endFlowId = `last_to_${subProcess.endNodeId}`;
    const lastNodeIdx = subProcess.nodes.findIndex((n) => n.id === lastNodeId);
    const lastNodeDims =
      SHAPE_DIMENSIONS[subProcess.nodes[lastNodeIdx]?.type || "Task"];
    const lastNodeX = subProcessPos.x + (dims.width + lastNodeDims.width) / 2;
    const lastNodeY =
      subProcessPos.y +
      verticalSpacing * (lastNodeIdx + 2) +
      lastNodeDims.height / 2;
    const endX = subProcessPos.x + dims.width - padding - 18;
    const endY = subProcessPos.y + verticalSpacing * internalNodeCount + 18;

    xml += `      <bpmndi:BPMNEdge id="${endFlowId}_di" bpmnElement="${endFlowId}">\n`;
    xml += `        <di:waypoint x="${Math.round(lastNodeX)}" y="${Math.round(
      lastNodeY
    )}" />\n`;
    xml += `        <di:waypoint x="${Math.round(endX)}" y="${Math.round(
      endY
    )}" />\n`;
    xml += `      </bpmndi:BPMNEdge>\n`;

    // Generate edges for nested subprocesses (in_loop)
    if (subProcess.nestedSubProcesses) {
      subProcess.nestedSubProcesses.forEach(
        (nestedSubProcess, nestedSubProcessId) => {
          // Find the nested subprocess position (from parent node position)
          const nestedNodeIdx = subProcess.nodes.findIndex(
            (n) => n.id === nestedSubProcessId
          );
          if (nestedNodeIdx < 0) return;

          const nestedDims = { width: 200, height: 150 };
          const nestedX = subProcessPos.x + (dims.width - nestedDims.width) / 2;
          const nestedY =
            subProcessPos.y + verticalSpacing * (nestedNodeIdx + 2);

          const nestedPadding = 15;
          const nestedInternalNodeCount = nestedSubProcess.nodes.length + 2;
          const nestedVerticalSpacing =
            (nestedDims.height - 2 * nestedPadding) /
            (nestedInternalNodeCount + 1);

          // Start to first node in nested subprocess
          const nestedStartFlowId = `${nestedSubProcess.startNodeId}_to_first`;
          let nestedFirstNodeId = nestedSubProcess.nodes[0]?.id;
          for (const node of nestedSubProcess.nodes) {
            const hasInternalIncoming = nestedSubProcess.internalFlows.some(
              (f) => f.target === node.id
            );
            if (!hasInternalIncoming) {
              nestedFirstNodeId = node.id;
              break;
            }
          }

          const nestedStartX = nestedX + nestedPadding + 18;
          const nestedStartY = nestedY + nestedVerticalSpacing + 18;
          const nestedFirstNodeIdx = nestedSubProcess.nodes.findIndex(
            (n) => n.id === nestedFirstNodeId
          );
          const nestedFirstNodeDims = SHAPE_DIMENSIONS[
            nestedSubProcess.nodes[nestedFirstNodeIdx]?.type || "Task"
          ] || { width: 80, height: 60 };
          const nestedFirstNodeX =
            nestedX + (nestedDims.width - nestedFirstNodeDims.width) / 2;
          const nestedFirstNodeY =
            nestedY +
            nestedVerticalSpacing * (nestedFirstNodeIdx + 2) +
            nestedFirstNodeDims.height / 2;

          xml += `      <bpmndi:BPMNEdge id="${nestedStartFlowId}_di" bpmnElement="${nestedStartFlowId}">\n`;
          xml += `        <di:waypoint x="${Math.round(
            nestedStartX
          )}" y="${Math.round(nestedStartY)}" />\n`;
          xml += `        <di:waypoint x="${Math.round(
            nestedFirstNodeX
          )}" y="${Math.round(nestedFirstNodeY)}" />\n`;
          xml += `      </bpmndi:BPMNEdge>\n`;

          // Internal flows within nested subprocess
          nestedSubProcess.internalFlows.forEach((flow) => {
            const flowId = generateFlowId(flow.source, flow.target);
            const sourceIdx = nestedSubProcess.nodes.findIndex(
              (n) => n.id === flow.source
            );
            const targetIdx = nestedSubProcess.nodes.findIndex(
              (n) => n.id === flow.target
            );

            if (sourceIdx >= 0 && targetIdx >= 0) {
              const sourceDims = SHAPE_DIMENSIONS[
                nestedSubProcess.nodes[sourceIdx].type
              ] || { width: 80, height: 60 };
              const targetDims = SHAPE_DIMENSIONS[
                nestedSubProcess.nodes[targetIdx].type
              ] || { width: 80, height: 60 };

              const sourceX =
                nestedX + (nestedDims.width + sourceDims.width) / 2;
              const sourceY =
                nestedY +
                nestedVerticalSpacing * (sourceIdx + 2) +
                sourceDims.height / 2;
              const targetX =
                nestedX + (nestedDims.width - targetDims.width) / 2;
              const targetY =
                nestedY +
                nestedVerticalSpacing * (targetIdx + 2) +
                targetDims.height / 2;

              xml += `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">\n`;
              xml += `        <di:waypoint x="${Math.round(
                sourceX
              )}" y="${Math.round(sourceY)}" />\n`;
              xml += `        <di:waypoint x="${Math.round(
                targetX
              )}" y="${Math.round(targetY)}" />\n`;
              xml += `      </bpmndi:BPMNEdge>\n`;
            }
          });

          // Last node to end in nested subprocess
          let nestedLastNodeId =
            nestedSubProcess.nodes[nestedSubProcess.nodes.length - 1]?.id;
          for (const node of nestedSubProcess.nodes) {
            const hasInternalOutgoing = nestedSubProcess.internalFlows.some(
              (f) => f.source === node.id
            );
            if (!hasInternalOutgoing) {
              nestedLastNodeId = node.id;
              break;
            }
          }

          const nestedEndFlowId = `last_to_${nestedSubProcess.endNodeId}`;
          const nestedLastNodeIdx = nestedSubProcess.nodes.findIndex(
            (n) => n.id === nestedLastNodeId
          );
          const nestedLastNodeDims = SHAPE_DIMENSIONS[
            nestedSubProcess.nodes[nestedLastNodeIdx]?.type || "Task"
          ] || { width: 80, height: 60 };
          const nestedLastNodeX =
            nestedX + (nestedDims.width + nestedLastNodeDims.width) / 2;
          const nestedLastNodeY =
            nestedY +
            nestedVerticalSpacing * (nestedLastNodeIdx + 2) +
            nestedLastNodeDims.height / 2;
          const nestedEndX = nestedX + nestedDims.width - nestedPadding - 18;
          const nestedEndY =
            nestedY + nestedVerticalSpacing * nestedInternalNodeCount + 18;

          xml += `      <bpmndi:BPMNEdge id="${nestedEndFlowId}_di" bpmnElement="${nestedEndFlowId}">\n`;
          xml += `        <di:waypoint x="${Math.round(
            nestedLastNodeX
          )}" y="${Math.round(nestedLastNodeY)}" />\n`;
          xml += `        <di:waypoint x="${Math.round(
            nestedEndX
          )}" y="${Math.round(nestedEndY)}" />\n`;
          xml += `      </bpmndi:BPMNEdge>\n`;
        }
      );
    }
  });

  xml += `    </bpmndi:BPMNPlane>\n`;
  xml += `  </bpmndi:BPMNDiagram>\n`;
  xml += `</bpmn:definitions>\n`;

  return xml;
}

// =============================================================================
// ACTIVITY GENERATION FROM MAPPING
// =============================================================================

/**
 * Generate activities list from BPMN nodes and activity mappings
 * This creates the activities array compatible with the RPA system
 */
export function generateActivities(
  nodes: BpmnNodeJson[],
  flows: BpmnFlowJson[],
  mappings?: ActivityMapping[]
): Activity[] {
  const mappingByNodeId = new Map<string, ActivityMapping>();
  mappings?.forEach((m) => mappingByNodeId.set(m.node_id, m));

  const activities: Activity[] = [];

  // Generate activities for all nodes
  nodes.forEach((node) => {
    const bpmnType = `bpmn:${node.type
      .charAt(0)
      .toLowerCase()}${node.type.slice(1)}`;
    const mapping = mappingByNodeId.get(node.id);

    const activity: Activity = {
      activityID: node.id,
      activityName: node.name || "",
      activityType: bpmnType,
      keyword: mapping?.activity_id || "",
      properties: {},
    };

    // If mapping exists, build properties from it
    if (mapping) {
      activity.properties = buildActivityProperties(node, mapping);
    }

    activities.push(activity);
  });

  // Generate activities for flows (for condition flows)
  flows.forEach((flow) => {
    if (flow.condition) {
      const flowId = generateFlowId(flow.source, flow.target);
      activities.push({
        activityID: flowId,
        activityName: flow.condition,
        activityType: "bpmn:sequenceFlow",
        properties: {
          // Condition will be set up later by user
          arguments: {},
        },
      });
    }
  });

  return activities;
}

/**
 * Build activity properties from mapping data
 */
function buildActivityProperties(
  node: BpmnNodeJson,
  mapping: ActivityMapping
): object {
  // Parse activity_id to extract package and activity name
  // Format: "package.activity_name" or just "activity_name"
  const activityParts = mapping.activity_id.split(".");
  const hasPackage = activityParts.length > 1;
  const activityPackage = hasPackage ? activityParts[0] : "";
  const activityName = hasPackage
    ? activityParts.slice(1).join(".")
    : mapping.activity_id;

  const properties: Record<string, unknown> = {
    activityPackage: activityPackage,
    activityName: activityName,
    serviceName: activityPackage,
    arguments: {},
    assigns: [],
    // Store mapping metadata for reference
    _mapping: {
      confidence: mapping.confidence,
      manual_review: mapping.manual_review,
      candidates: mapping.candidates,
      input_bindings: mapping.input_bindings,
      outputs: mapping.outputs,
    },
  };

  // Convert input_bindings to arguments if available
  if (mapping.input_bindings && typeof mapping.input_bindings === "object") {
    const args: Record<string, object> = {};
    Object.entries(mapping.input_bindings).forEach(([key, value]) => {
      args[key] = {
        type: "string",
        description: "",
        keywordArg: key,
        value: String(value),
        overrideType: null,
      };
    });
    properties.arguments = args;
  }

  return properties;
}

// =============================================================================
// COMPLETE CONVERTER - Returns XML, Activities, Variables
// =============================================================================

export interface ProcessConversionResult {
  success: boolean;
  xml?: string;
  activities?: Activity[];
  variables?: Variable[];
  errors?: string[];
}

/**
 * Complete converter that takes JSON and returns all necessary data for RPA system
 * - XML: BPMN diagram XML for visualization
 * - Activities: List of activities with properties for each node
 * - Variables: Placeholder for variables (to be populated later)
 */
export function convertJsonToProcess(
  data: unknown,
  layoutOptions?: LayoutOptions
): ProcessConversionResult {
  // Validate input
  const validation = validateBpmnJson(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const typedData = data as BpmnJsonData;

  try {
    // Generate XML
    const xml = jsonToBpmnXml(typedData, layoutOptions);

    // Generate activities from nodes and mappings
    const activities = generateActivities(
      typedData.bpmn.nodes,
      typedData.bpmn.flows,
      typedData.mapping
    );

    // Initialize empty variables (to be populated by user later)
    const variables: Variable[] = [];

    return {
      success: true,
      xml,
      activities,
      variables,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Conversion failed: ${(error as Error).message}`],
    };
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

export function validateBpmnJson(data: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Input must be an object");
    return { valid: false, errors };
  }

  const typedData = data as Record<string, unknown>;

  if (!typedData.bpmn || typeof typedData.bpmn !== "object") {
    errors.push('Missing or invalid "bpmn" property');
    return { valid: false, errors };
  }

  const bpmn = typedData.bpmn as Record<string, unknown>;

  if (!Array.isArray(bpmn.nodes)) {
    errors.push('Missing or invalid "bpmn.nodes" array');
  }

  if (!Array.isArray(bpmn.flows)) {
    errors.push('Missing or invalid "bpmn.flows" array');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate nodes
  const nodeIds = new Set<string>();
  (bpmn.nodes as BpmnNodeJson[]).forEach((node, index) => {
    if (!node.id) {
      errors.push(`Node at index ${index} is missing "id"`);
    } else if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    } else {
      nodeIds.add(node.id);
    }

    if (!node.type) {
      errors.push(`Node at index ${index} is missing "type"`);
    }
  });

  // Validate flows
  (bpmn.flows as BpmnFlowJson[]).forEach((flow, index) => {
    if (!flow.source) {
      errors.push(`Flow at index ${index} is missing "source"`);
    } else if (!nodeIds.has(flow.source)) {
      errors.push(
        `Flow at index ${index} references non-existent source node: ${flow.source}`
      );
    }

    if (!flow.target) {
      errors.push(`Flow at index ${index} is missing "target"`);
    } else if (!nodeIds.has(flow.target)) {
      errors.push(
        `Flow at index ${index} references non-existent target node: ${flow.target}`
      );
    }
  });

  // Check for start and end events
  const hasStartEvent = (bpmn.nodes as BpmnNodeJson[]).some(
    (n) => n.type === "StartEvent"
  );
  const hasEndEvent = (bpmn.nodes as BpmnNodeJson[]).some(
    (n) => n.type === "EndEvent"
  );

  if (!hasStartEvent) {
    errors.push("Process must have at least one StartEvent");
  }

  if (!hasEndEvent) {
    errors.push("Process must have at least one EndEvent");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Convert JSON to BPMN XML with validation (legacy function)
 */
export function convertJsonToBpmn(data: unknown): {
  success: boolean;
  xml?: string;
  errors?: string[];
} {
  const validation = validateBpmnJson(data);

  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  try {
    const xml = jsonToBpmnXml(data as BpmnJsonData);
    return { success: true, xml };
  } catch (error) {
    return {
      success: false,
      errors: [`XML generation failed: ${(error as Error).message}`],
    };
  }
}

// =============================================================================
// INTEGRATION WITH MODELER
// =============================================================================

/**
 * Parse JSON and import directly into bpmn-js modeler
 */
export async function importJsonToModeler(
  modeler: any,
  data: BpmnJsonData
): Promise<{ warnings?: string[] }> {
  const result = convertJsonToBpmn(data);

  if (!result.success || !result.xml) {
    throw new Error(
      `Failed to convert JSON to BPMN: ${result.errors?.join(", ")}`
    );
  }

  return modeler.importXML(result.xml);
}

/**
 * Full integration: Import JSON to modeler and return all data for RPA system
 */
export async function importJsonToModelerWithActivities(
  modeler: any,
  data: BpmnJsonData,
  layoutOptions?: LayoutOptions
): Promise<{
  warnings?: string[];
  activities: Activity[];
  variables: Variable[];
}> {
  const result = convertJsonToProcess(data, layoutOptions);

  if (!result.success || !result.xml) {
    throw new Error(
      `Failed to convert JSON to BPMN: ${result.errors?.join(", ")}`
    );
  }

  const importResult = await modeler.importXML(result.xml);

  return {
    warnings: importResult.warnings,
    activities: result.activities || [],
    variables: result.variables || [],
  };
}

// =============================================================================
// EXPORT LAYOUT OPTIONS TYPE
// =============================================================================

export type { LayoutOptions };
