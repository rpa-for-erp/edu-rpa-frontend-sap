import { Bpmn, Convert } from ".";
import { BpmnElement } from "./model/bpmn.dto";
import {
  BpmnEndEvent,
  BpmnExclusiveGateway,
  BpmnParallelGateway,
  BpmnInclusiveGateway,
  BpmnFlow,
  BpmnStartEvent,
  BpmnTask,
  BpmnProcess,
  BpmnSubProcess,
} from "./model/bpmn";

import { ConcreteGraphVisitor, ConcreteSequenceVisitor } from "./visitor";
import { ProcessVariables, Properties } from "./model/properties.model";
import { Variable } from "@/types/variable";
import { Robot } from "./visitor/robot";

var convert = require("xml-js");
var options = { ignoreComment: true, alwaysChildren: true };

export class BpmnParser {
  constructor() {}

  public parse(xml: string, properties: Properties[], variables: Variable[]) {
    // Convert XML to JSON Format
    let result = convert.xml2js(xml, options);
    let bpmn: Bpmn = Convert.toBpmn(JSON.stringify(result));
    // Conver JSON To BpmnObject
    let process = bpmn.elements[0].elements.filter((e) =>
      e.name.toLowerCase().includes("process")
    )[0];
    const process_name = process.name;
    const process_attributes = process.attributes;
    let bpmnProcess = new BpmnProcess(process_name, process_attributes.id);
    this.parseElement(process.elements as BpmnElement[], bpmnProcess);

    // Log parsed elements and flows for debugging
    const elementIds = Object.keys(bpmnProcess.elements);
    const flows = Object.values(bpmnProcess.flows);
    console.log("[BPMN Parser] Parsed elements:", elementIds);
    console.log(
      "[BPMN Parser] Parsed flows:",
      flows.map((f) => `${f.id}: ${f.source} -> ${f.target}`)
    );

    // Validate flows - check for orphaned flows that reference non-existent elements
    const orphanedFlows = flows.filter(
      (f) => !elementIds.includes(f.source) || !elementIds.includes(f.target)
    );
    if (orphanedFlows.length > 0) {
      console.warn(
        `[BPMN Parser] Found ${orphanedFlows.length} orphaned flow(s) referencing non-existent elements:`,
        orphanedFlows.map((f) => `${f.id}: ${f.source} -> ${f.target}`)
      );
      console.warn(
        "[BPMN Parser] This usually happens when elements are deleted but the workflow isn't properly saved. " +
          "Try refreshing the page or manually reconnecting the elements."
      );
    }

    bpmnProcess.check();

    // Component Analyze: Detect control sequence If Branch
    let g = new ConcreteGraphVisitor(bpmnProcess);
    let sequence = g.buildGraph().buildBasicBlock();
    console.log("Bpmn Process", sequence);

    let parser = new ConcreteSequenceVisitor(sequence, properties, variables);
    let robot = parser.parse();
    let credentials = parser.getCredentials();

    try {
      return {
        code: robot.toJSON(),
        credentials,
      };
    } catch (error) {
      throw error;
    }
  }

  public parseXML(xml: string) {
    let result = convert.xml2js(xml, options);
    let bpmn: Bpmn = Convert.toBpmn(JSON.stringify(result));

    // Conver JSON To BpmnObject
    let process = bpmn.elements[0].elements.filter((e) =>
      e.name.toLowerCase().includes("process")
    )[0];
    const process_name = process.name;
    const process_attributes = process.attributes;
    let bpmnProcess = new BpmnProcess(process_name, process_attributes.id);
    this.parseElement(process.elements as BpmnElement[], bpmnProcess);
    bpmnProcess.check();

    // Component Analyze: Detect control sequence If Branch
    let g = new ConcreteGraphVisitor(bpmnProcess);
    let sequence = g.buildGraph().buildBasicBlock();
    return sequence;
  }

  private parseElement(elements: BpmnElement[], process: BpmnProcess) {
    if (!elements || !Array.isArray(elements)) return;

    elements.forEach((element) => {
      if (!element || !element.name) return;

      // Use lowercase for case-insensitive matching
      const elementName = element.name.toLowerCase();

      // Debug logging to see all elements being parsed
      const elementId = element.attributes?.id || "unknown";
      console.log(
        `[BPMN Parser] Processing element: name="${element.name}", id="${elementId}"`
      );

      switch (true) {
        case elementName.includes("startevent"):
          let startEvent = new BpmnStartEvent(element);
          process.elements[startEvent.id] = startEvent;
          break;
        case elementName.includes("endevent"):
          let endEvent = new BpmnEndEvent(element);
          process.elements[endEvent.id] = endEvent;
          break;
        case elementName.includes("task") || elementName.includes("activity"):
          // This matches all task types: task, userTask, manualTask, sendTask, receiveTask, serviceTask, scriptTask, businessRuleTask
          // Also matches activity types for compatibility
          let bpmnTask: BpmnTask = new BpmnTask(element);
          process.elements[bpmnTask.id] = bpmnTask;
          break;
        case elementName.includes("exclusivegateway"):
          let bpmnExclusiveGateway: BpmnExclusiveGateway =
            new BpmnExclusiveGateway(element);
          process.elements[bpmnExclusiveGateway.id] = bpmnExclusiveGateway;
          break;
        case elementName.includes("parallelgateway"):
          let bpmnParallelGateway: BpmnParallelGateway =
            new BpmnParallelGateway(element);
          process.elements[bpmnParallelGateway.id] = bpmnParallelGateway;
          break;
        case elementName.includes("inclusivegateway"):
          let bpmnInclusiveGateway: BpmnInclusiveGateway =
            new BpmnInclusiveGateway(element);
          process.elements[bpmnInclusiveGateway.id] = bpmnInclusiveGateway;
          break;
        case elementName.includes("sequenceflow"):
          let bpmnFlow: BpmnFlow = new BpmnFlow(element);
          process.flows[bpmnFlow.id] = bpmnFlow;
          break;
        case elementName.includes("subprocess"):
          let bpmnSubprocess: BpmnSubProcess = new BpmnSubProcess(element);
          process.elements[bpmnSubprocess.id] = bpmnSubprocess;
          this.parseElement(element.elements, bpmnSubprocess);
          bpmnSubprocess.check();
          break;
        default:
          // Log unhandled elements to help identify missing types
          if (
            !elementName.includes("incoming") &&
            !elementName.includes("outgoing") &&
            !elementName.includes("waypoint") &&
            !elementName.includes("bounds") &&
            !elementName.includes("label") &&
            !elementName.includes("shape") &&
            !elementName.includes("edge") &&
            !elementName.includes("plane") &&
            !elementName.includes("diagram")
          ) {
            console.warn(
              `[BPMN Parser] Unhandled element type: "${element.name}", id="${element.attributes?.id}"`
            );
          }
      }
    });
  }

  parse2Sequence(xml: string) {
    // Convert XML to JSON Format
    let result = convert.xml2js(xml, options);
    let bpmn: Bpmn = Convert.toBpmn(JSON.stringify(result));

    // Conver JSON To BpmnObject
    let process = bpmn.elements[0].elements.filter((e) =>
      e.name.toLowerCase().includes("process")
    )[0];
    const process_name = process.name;
    const process_attributes = process.attributes;
    let bpmnProcess = new BpmnProcess(process_name, process_attributes.id);
    this.parseElement(process.elements as BpmnElement[], bpmnProcess);
    bpmnProcess.check();

    // Component Analyze: Detect control sequence If Branch
    let g = new ConcreteGraphVisitor(bpmnProcess);
    let sequence = g.buildGraph().buildBasicBlock();
    return sequence;
  }
}
