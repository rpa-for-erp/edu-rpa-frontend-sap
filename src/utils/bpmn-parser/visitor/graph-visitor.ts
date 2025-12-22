import { DirectedAcyclicGraph } from "typescript-graph";
import { BpmnParseError, BpmnParseErrorCode } from "../error";
import {
  BpmnNode,
  BpmnProcess,
  BpmnStartEvent,
  BpmnEndEvent,
  BpmnTask,
  BpmnExclusiveGateway,
  BpmnParallelGateway,
  BpmnInclusiveGateway,
  BpmnSubProcess,
} from "../model/bpmn";
import { Sequence, Branch, BlankBlock, IfBranchBlock } from "./BasicBlock";
import { CustomGraph } from "./graph";

export class GraphVisitor {
  visit(node: BpmnNode | undefined, param: any) {
    if (!node) return { sequence: param, joinNodeId: null };
    return node.accept(this, param);
  }

  visitBpmnTask(node: BpmnNode, sequence: Sequence) {}
  visitBpmnExclusiveGateway(node: BpmnNode, sequence: Sequence) {}
  visitBpmnParallelGateway(node: BpmnNode, sequence: Sequence) {}
  visitBpmnInclusiveGateway(node: BpmnNode, sequence: Sequence) {}
  visitBpmnEndEvent(node: BpmnNode, sequence: Sequence) {}
  visitBpmnStartEvent(node: BpmnNode, sequence: Sequence) {}
}

export class ConcreteGraphVisitor extends GraphVisitor {
  graph: CustomGraph<BpmnNode>;
  haveCycle: boolean;
  splitNode: string[];
  joinNode: string[];
  visited: string[];
  source: string;
  sink: string;

  constructor(public process: BpmnProcess) {
    super();
    this.graph = new CustomGraph<BpmnNode>((n: BpmnNode) => n.id);
    this.haveCycle = false;
    this.splitNode = [];
    this.joinNode = [];
    this.visited = [];
    this.source = "";
    this.sink = "";
  }

  buildGraph() {
    let nodes = this.process.elements;
    let edges = this.process.flows;
    this.source =
      Object.values(nodes).find((node) => node instanceof BpmnStartEvent)?.id ||
      "";

    this.sink =
      Object.values(nodes).find((node) => node instanceof BpmnEndEvent)?.id ||
      "";

    // Build Graph - insert all nodes first
    const nodeIds = new Set(Object.keys(nodes));
    Object.keys(nodes).forEach((nodeId: string) =>
      this.graph.insert(nodes[nodeId])
    );

    // Add edges only if both source and target nodes exist in the graph
    // This prevents errors when XML contains stale references to deleted elements
    Object.values(edges).forEach((edge) => {
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        this.graph.addEdge(edge.source, edge.target);
      } else {
        console.warn(
          `Skipping edge ${edge.id}: source="${edge.source}" or target="${edge.target}" not found in graph. ` +
            `Available nodes: [${Array.from(nodeIds).join(", ")}]`
        );
      }
    });

    this.haveCycle = !this.graph.isAcyclic();

    // Check Graph Condition
    this.check();

    // Initialize Split and Join Node List
    this.splitNode = this.graph
      .getNodes()
      .map((node) => node.id)
      .filter((nodeid) => this.graph.outDegreeOfNode(nodeid) > 1);
    this.joinNode = this.graph
      .getNodes()
      .map((node) => node.id)
      .filter((nodeid) => this.graph.indegreeOfNode(nodeid) > 1);
    return this;
  }

  private check() {
    if (this.haveCycle) {
      throw new BpmnParseError(
        BpmnParseErrorCode["Detected Loop in Process - Unsupported"],
        this.process.id
      );
    }

    // Source and Sink must connect
    if (!this.graph.canReachFrom(this.source, this.sink)) {
      const nodeIds = this.graph.getNodes().map((n) => n.id);
      const flowInfo = Object.values(this.process.flows).map(
        (f) => `${f.source} -> ${f.target}`
      );
      console.error(
        `[BPMN Parser] Workflow validation failed:\n` +
          `  - Available nodes: [${nodeIds.join(", ")}]\n` +
          `  - Flows in XML: [${flowInfo.join(", ")}]\n` +
          `  - Some flows may reference nodes that were deleted or not properly synced.\n` +
          `  - Try refreshing the page or re-saving the workflow.`
      );
      throw new BpmnParseError(
        BpmnParseErrorCode[
          "Invalid Workflow - start and end event not connect"
        ],
        this.process.id
      );
    }
    // Check if start is StartEvent and end is EndEvent
    const topoSortArray = DirectedAcyclicGraph.fromDirectedGraph(
      this.graph
    ).topologicallySortedNodes();
    if (
      !(topoSortArray[0] instanceof BpmnStartEvent) &&
      !(topoSortArray[topoSortArray.length - 1] instanceof BpmnEndEvent)
    ) {
      throw new BpmnParseError(
        BpmnParseErrorCode[
          "Invalid Struture - Flow Must Follow From End To Start"
        ],
        this.process.id
      );
    }
  }

  buildBasicBlock() {
    let sequence = this.dfs(this.source);
    return sequence;
  }

  visitBpmnTask(node: BpmnTask, sequence: Sequence) {
    let nodeId = node.id;
    let adjacent = this.graph.getAdjacent(nodeId);
    if (this.visited.includes(nodeId)) return { sequence, joinNodeId: nodeId };
    this.visited.push(nodeId);

    if (this.joinNode.includes(nodeId)) {
      // Task is Join Node - Ignore First Time Visit Until All Branch Visited
      let curBlock = sequence.block.at(-1);
      if (curBlock instanceof Branch && curBlock.join == nodeId) {
        sequence.block.push(node);
        return this.visit(this.graph.getNode(adjacent[0]), sequence);
      }
      if (sequence.scope && sequence.scope instanceof Branch)
        return { sequence, joinNodeId: nodeId };
    }
    sequence.block.push(node);
    return this.visit(this.graph.getNode(adjacent[0]), sequence);
  }

  visitBpmnExclusiveGateway(node: BpmnExclusiveGateway, sequence: Sequence) {
    let nodeId = node.id;
    let adjacent = this.graph.getAdjacent(nodeId);
    if (this.visited.includes(nodeId)) return { sequence, joinNodeId: nodeId };
    this.visited.push(nodeId);

    if (this.splitNode.includes(nodeId)) {
      let curBlock = new Branch(nodeId, null, [], "exclusive");
      let joinNodeId: string = "";

      // Visit all branch except join node
      for (let n of adjacent) {
        let { sequence: branchSequence, joinNodeId: branchJoinNodeId } =
          this.visit(this.graph.getNode(n), new Sequence([], curBlock));
        let conditionFlow = this.findEdgeId(nodeId, n);
        if (!conditionFlow) {
          throw new BpmnParseError("Unknow Error", nodeId);
        }
        let ifBranch = new IfBranchBlock(branchSequence, conditionFlow);
        curBlock.branches.push(ifBranch);
        joinNodeId = branchJoinNodeId;
      }
      curBlock.join = joinNodeId; // Set join node of branching
      // Visit Join Node
      this.visited = this.visited.filter((e) => e != joinNodeId);
      sequence.block.push(curBlock);
      return this.visit(this.graph.getNode(joinNodeId), sequence);
    } else if (this.joinNode.includes(nodeId)) {
      let curBlock = sequence.block.at(-1);
      if (curBlock instanceof Branch && curBlock.join == nodeId) {
        return this.visit(this.graph.getNode(adjacent[0]), sequence);
      }
      return { sequence, joinNodeId: nodeId };
    }
  }

  visitBpmnParallelGateway(node: BpmnParallelGateway, sequence: Sequence) {
    let nodeId = node.id;
    let adjacent = this.graph.getAdjacent(nodeId);
    if (this.visited.includes(nodeId)) return { sequence, joinNodeId: nodeId };
    this.visited.push(nodeId);

    if (this.splitNode.includes(nodeId)) {
      // Parallel Gateway: Execute all branches in parallel
      // For now, we'll treat it sequentially as Robot Framework doesn't support true parallelism
      // All branches will execute without conditions
      let curBlock = new Branch(nodeId, null, [], "parallel");
      let joinNodeId: string = "";

      // Visit all branch except join node
      for (let n of adjacent) {
        let { sequence: branchSequence, joinNodeId: branchJoinNodeId } =
          this.visit(this.graph.getNode(n), new Sequence([], curBlock));
        let conditionFlow = this.findEdgeId(nodeId, n);
        if (!conditionFlow) {
          throw new BpmnParseError("Unknow Error", nodeId);
        }
        // Parallel branches don't need conditions
        let ifBranch = new IfBranchBlock(branchSequence, conditionFlow);
        curBlock.branches.push(ifBranch);
        joinNodeId = branchJoinNodeId;
      }
      curBlock.join = joinNodeId; // Set join node of branching
      // Visit Join Node
      this.visited = this.visited.filter((e) => e != joinNodeId);
      sequence.block.push(curBlock);
      return this.visit(this.graph.getNode(joinNodeId), sequence);
    } else if (this.joinNode.includes(nodeId)) {
      let curBlock = sequence.block.at(-1);
      if (curBlock instanceof Branch && curBlock.join == nodeId) {
        return this.visit(this.graph.getNode(adjacent[0]), sequence);
      }
      return { sequence, joinNodeId: nodeId };
    }
  }

  visitBpmnInclusiveGateway(node: BpmnInclusiveGateway, sequence: Sequence) {
    let nodeId = node.id;
    let adjacent = this.graph.getAdjacent(nodeId);
    if (this.visited.includes(nodeId)) return { sequence, joinNodeId: nodeId };
    this.visited.push(nodeId);

    if (this.splitNode.includes(nodeId)) {
      // Inclusive Gateway: Similar to Exclusive Gateway but can execute multiple branches
      // Treat it the same as Exclusive Gateway for now
      let curBlock = new Branch(nodeId, null, [], "inclusive");
      let joinNodeId: string = "";

      // Visit all branch except join node
      for (let n of adjacent) {
        let { sequence: branchSequence, joinNodeId: branchJoinNodeId } =
          this.visit(this.graph.getNode(n), new Sequence([], curBlock));
        let conditionFlow = this.findEdgeId(nodeId, n);
        if (!conditionFlow) {
          throw new BpmnParseError("Unknow Error", nodeId);
        }
        let ifBranch = new IfBranchBlock(branchSequence, conditionFlow);
        curBlock.branches.push(ifBranch);
        joinNodeId = branchJoinNodeId;
      }
      curBlock.join = joinNodeId; // Set join node of branching
      // Visit Join Node
      this.visited = this.visited.filter((e) => e != joinNodeId);
      sequence.block.push(curBlock);
      return this.visit(this.graph.getNode(joinNodeId), sequence);
    } else if (this.joinNode.includes(nodeId)) {
      let curBlock = sequence.block.at(-1);
      if (curBlock instanceof Branch && curBlock.join == nodeId) {
        return this.visit(this.graph.getNode(adjacent[0]), sequence);
      }
      return { sequence, joinNodeId: nodeId };
    }
  }

  visitBpmnEndEvent(node: BpmnEndEvent, sequence: Sequence) {
    let nodeId = node.id;
    if (this.visited.includes(nodeId)) return { sequence, joinNodeId: nodeId };
    this.visited.push(nodeId);

    return { sequence, joinNodeId: nodeId };
  }

  visitBpmnStartEvent(node: BpmnStartEvent, sequence: Sequence) {
    let nodeId = node.id;
    let adjacent = this.graph.getAdjacent(nodeId);
    if (this.visited.includes(nodeId)) return { sequence, joinNodeId: nodeId };
    this.visited.push(nodeId);

    return this.visit(this.graph.getNode(adjacent[0]), sequence);
  }

  visitBpmnSubProcess(node: BpmnSubProcess, sequence: Sequence) {
    let nodeId = node.id;
    let adjacent = this.graph.getAdjacent(nodeId);
    if (this.visited.includes(nodeId)) return { sequence, joinNodeId: nodeId };

    if (this.joinNode.includes(nodeId)) {
      // Task is Join Node - Ignore First Time Visit Until All Branch Visited
      let curBlock = sequence.block.at(-1);
      if (curBlock instanceof Branch && curBlock.join == nodeId) {
        let subProcessSequence = new ConcreteGraphVisitor(node)
          .buildGraph()
          .buildBasicBlock();
        sequence.block.push(new BlankBlock(node.id, subProcessSequence));
        return this.visit(this.graph.getNode(adjacent[0]), sequence);
      }
      if (sequence.scope && sequence.scope instanceof Branch)
        return { sequence, joinNodeId: nodeId };
    }
    let subProcessSequence = new ConcreteGraphVisitor(node)
      .buildGraph()
      .buildBasicBlock();
    sequence.block.push(new BlankBlock(node.id, subProcessSequence));
    return this.visit(this.graph.getNode(adjacent[0]), sequence);
  }

  dfs(nodeId: string) {
    let sequence: Sequence = new Sequence();
    this.visited = []; // Reset the visited array for each traversal.
    this.visit(this.graph.getNode(nodeId), sequence); // Start the traversal from the initial node.
    return sequence;
  }

  findEdgeId(gateWayId: string, firstNodeId: string) {
    let edges = this.process.flows;
    for (let flowId of Object.keys(edges)) {
      let edge = edges[flowId];
      if (gateWayId == edge.source && firstNodeId == edge.target) {
        return flowId;
      }
    }
    return null;
  }
}
