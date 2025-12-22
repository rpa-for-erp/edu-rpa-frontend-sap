import {
  jsonToBpmnXml,
  convertJsonToBpmn,
  convertJsonToProcess,
  generateActivities,
  validateBpmnJson,
  BpmnJsonData,
  BpmnNodeJson,
  BpmnFlowJson,
  ActivityMapping,
} from "@/utils/bpmn-parser/json-to-bpmn-xml.util";
import { writeFileSync } from "fs";

// =============================================================================
// TEST DATA
// =============================================================================

const createSimpleProcess = (): BpmnJsonData => ({
  bpmn: {
    nodes: [
      { id: "n0", type: "StartEvent", name: "Start" },
      { id: "n1", type: "Task", name: "Do Something" },
      { id: "n2", type: "EndEvent", name: "End" },
    ],
    flows: [
      { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
      { source: "n1", target: "n2", type: "SequenceFlow", condition: null },
    ],
  },
});

const createProcessWithGateway = (): BpmnJsonData => ({
  bpmn: {
    nodes: [
      { id: "n0", type: "StartEvent", name: "Start" },
      { id: "n1", type: "Task", name: "Check Condition" },
      { id: "n2", type: "ExclusiveGateway", name: "Decision" },
      { id: "n3", type: "Task", name: "Path A" },
      { id: "n4", type: "Task", name: "Path B" },
      { id: "n5", type: "ExclusiveGateway", name: "Join" },
      { id: "n6", type: "EndEvent", name: "End" },
    ],
    flows: [
      { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
      { source: "n1", target: "n2", type: "SequenceFlow", condition: null },
      { source: "n2", target: "n3", type: "SequenceFlow", condition: "Yes" },
      { source: "n2", target: "n4", type: "SequenceFlow", condition: "No" },
      { source: "n3", target: "n5", type: "SequenceFlow", condition: null },
      { source: "n4", target: "n5", type: "SequenceFlow", condition: null },
      { source: "n5", target: "n6", type: "SequenceFlow", condition: null },
    ],
  },
});

const createPurchaseProcess = (): BpmnJsonData => ({
  bpmn: {
    nodes: [
      { id: "n0", type: "StartEvent", name: "Start Purchase Process" },
      {
        id: "n1",
        type: "Task",
        name: "Connect to SAP, Email, and Google Drive",
        mapping: { is_automatic: true, bot_id: "bot1", manual_review: false },
      },
      {
        id: "n2",
        type: "Task",
        name: "Get Purchase Information from Email",
        mapping: { is_automatic: true, bot_id: "bot1", manual_review: false },
      },
      {
        id: "n3",
        type: "ExclusiveGateway",
        name: "Purchase Amount > 5000 USD?",
      },
      {
        id: "n4",
        type: "Task",
        name: "Create Business Partner in SAP",
        mapping: { is_automatic: true, bot_id: "bot1", manual_review: false },
      },
      {
        id: "n5",
        type: "Task",
        name: "Send Confirmation Email to Requester",
        mapping: { is_automatic: true, bot_id: "bot1", manual_review: false },
      },
      {
        id: "n6",
        type: "Task",
        name: "Upload Purchase Document to Google Drive",
        mapping: { is_automatic: true, bot_id: "bot1", manual_review: false },
      },
      {
        id: "n7",
        type: "UserTask",
        name: "Manual Approval",
        mapping: { is_automatic: false, manual_review: true },
      },
      {
        id: "n8",
        type: "Task",
        name: "Notify Finance Team",
        mapping: { is_automatic: true, bot_id: "bot1", manual_review: false },
      },
      { id: "n9", type: "ExclusiveGateway", name: "Join" },
      { id: "n10", type: "EndEvent", name: "End Process" },
    ],
    flows: [
      { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
      { source: "n1", target: "n2", type: "SequenceFlow", condition: null },
      { source: "n2", target: "n3", type: "SequenceFlow", condition: null },
      { source: "n3", target: "n4", type: "SequenceFlow", condition: "Yes" },
      { source: "n4", target: "n5", type: "SequenceFlow", condition: null },
      { source: "n5", target: "n9", type: "SequenceFlow", condition: null },
      { source: "n3", target: "n6", type: "SequenceFlow", condition: "No" },
      { source: "n6", target: "n8", type: "SequenceFlow", condition: null },
      { source: "n8", target: "n7", type: "SequenceFlow", condition: null },
      { source: "n7", target: "n9", type: "SequenceFlow", condition: null },
      { source: "n9", target: "n10", type: "SequenceFlow", condition: null },
    ],
  },
  mapping: [
    {
      node_id: "n1",
      activity_id: "connect_to_sap_system",
      confidence: 0.899,
      manual_review: false,
      type: "ServiceTask",
      candidates: [],
      input_bindings: {},
      outputs: [],
    },
  ],
});

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe("JSON to BPMN XML - Validation", () => {
  describe("validateBpmnJson", () => {
    it("should validate a correct simple process", () => {
      const data = createSimpleProcess();
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate a process with gateway", () => {
      const data = createProcessWithGateway();
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate the purchase process example", () => {
      const data = createPurchaseProcess();
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject null input", () => {
      const result = validateBpmnJson(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Input must be an object");
    });

    it("should reject undefined input", () => {
      const result = validateBpmnJson(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Input must be an object");
    });

    it("should reject non-object input", () => {
      const result = validateBpmnJson("string");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Input must be an object");
    });

    it("should reject missing bpmn property", () => {
      const result = validateBpmnJson({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "bpmn" property');
    });

    it("should reject missing nodes array", () => {
      const result = validateBpmnJson({ bpmn: { flows: [] } });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "bpmn.nodes" array');
    });

    it("should reject missing flows array", () => {
      const result = validateBpmnJson({ bpmn: { nodes: [] } });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "bpmn.flows" array');
    });

    it("should reject nodes without id", () => {
      const data = {
        bpmn: {
          nodes: [
            { type: "StartEvent", name: "Start" },
            { id: "n1", type: "EndEvent", name: "End" },
          ],
          flows: [],
        },
      };
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('missing "id"'))).toBe(true);
    });

    it("should reject duplicate node ids", () => {
      const data = {
        bpmn: {
          nodes: [
            { id: "n0", type: "StartEvent", name: "Start" },
            { id: "n0", type: "EndEvent", name: "End" },
          ],
          flows: [],
        },
      };
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Duplicate node id"))).toBe(
        true
      );
    });

    it("should reject nodes without type", () => {
      const data = {
        bpmn: {
          nodes: [
            { id: "n0", name: "Start" },
            { id: "n1", type: "EndEvent", name: "End" },
          ],
          flows: [],
        },
      };
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('missing "type"'))).toBe(
        true
      );
    });

    it("should reject flows referencing non-existent source", () => {
      const data = {
        bpmn: {
          nodes: [
            { id: "n0", type: "StartEvent", name: "Start" },
            { id: "n1", type: "EndEvent", name: "End" },
          ],
          flows: [
            {
              source: "invalid",
              target: "n1",
              type: "SequenceFlow",
              condition: null,
            },
          ],
        },
      };
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("non-existent source node"))
      ).toBe(true);
    });

    it("should reject flows referencing non-existent target", () => {
      const data = {
        bpmn: {
          nodes: [
            { id: "n0", type: "StartEvent", name: "Start" },
            { id: "n1", type: "EndEvent", name: "End" },
          ],
          flows: [
            {
              source: "n0",
              target: "invalid",
              type: "SequenceFlow",
              condition: null,
            },
          ],
        },
      };
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("non-existent target node"))
      ).toBe(true);
    });

    it("should reject process without StartEvent", () => {
      const data = {
        bpmn: {
          nodes: [
            { id: "n0", type: "Task", name: "Task" },
            { id: "n1", type: "EndEvent", name: "End" },
          ],
          flows: [
            {
              source: "n0",
              target: "n1",
              type: "SequenceFlow",
              condition: null,
            },
          ],
        },
      };
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes("must have at least one StartEvent")
        )
      ).toBe(true);
    });

    it("should reject process without EndEvent", () => {
      const data = {
        bpmn: {
          nodes: [
            { id: "n0", type: "StartEvent", name: "Start" },
            { id: "n1", type: "Task", name: "Task" },
          ],
          flows: [
            {
              source: "n0",
              target: "n1",
              type: "SequenceFlow",
              condition: null,
            },
          ],
        },
      };
      const result = validateBpmnJson(data);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("must have at least one EndEvent"))
      ).toBe(true);
    });
  });
});

// =============================================================================
// XML GENERATION TESTS
// =============================================================================

describe("JSON to BPMN XML - XML Generation", () => {
  describe("jsonToBpmnXml", () => {
    it("should generate valid XML declaration", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });

    it("should include BPMN definitions with correct namespaces", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain(
        'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"'
      );
      expect(xml).toContain(
        'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"'
      );
      expect(xml).toContain(
        'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"'
      );
      expect(xml).toContain(
        'xmlns:di="http://www.omg.org/spec/DD/20100524/DI"'
      );
    });

    it("should include process element", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toMatch(
        /<bpmn:process id="Process_[^"]+" isExecutable="true">/
      );
    });

    it("should generate StartEvent element", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain('<bpmn:startEvent id="n0" name="Start">');
      expect(xml).toContain("</bpmn:startEvent>");
    });

    it("should generate EndEvent element", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain('<bpmn:endEvent id="n2" name="End">');
      expect(xml).toContain("</bpmn:endEvent>");
    });

    it("should generate Task element", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain('<bpmn:task id="n1" name="Do Something">');
      expect(xml).toContain("</bpmn:task>");
    });

    it("should generate UserTask element", () => {
      const data = createPurchaseProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain('<bpmn:userTask id="n7" name="Manual Approval">');
      expect(xml).toContain("</bpmn:userTask>");
    });

    it("should generate ExclusiveGateway element", () => {
      const data = createProcessWithGateway();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain('<bpmn:exclusiveGateway id="n2" name="Decision">');
      expect(xml).toContain("</bpmn:exclusiveGateway>");
    });

    it("should generate SequenceFlow elements", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain(
        '<bpmn:sequenceFlow id="Flow_n0_n1" sourceRef="n0" targetRef="n1"'
      );
      expect(xml).toContain(
        '<bpmn:sequenceFlow id="Flow_n1_n2" sourceRef="n1" targetRef="n2"'
      );
    });

    it("should generate conditional flows with condition expression", () => {
      const data = createProcessWithGateway();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain('name="Yes"');
      expect(xml).toContain("<bpmn:conditionExpression");
      expect(xml).toContain(">Yes</bpmn:conditionExpression>");
    });

    it("should generate incoming/outgoing references", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      // n1 (Task) should have incoming from n0 and outgoing to n2
      expect(xml).toContain("<bpmn:incoming>Flow_n0_n1</bpmn:incoming>");
      expect(xml).toContain("<bpmn:outgoing>Flow_n1_n2</bpmn:outgoing>");
    });

    it("should generate BPMNDiagram section", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toMatch(/<bpmndi:BPMNDiagram id="BPMNDiagram_[^"]+">/);
      expect(xml).toContain("</bpmndi:BPMNDiagram>");
    });

    it("should generate BPMNPlane section", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toMatch(
        /<bpmndi:BPMNPlane id="BPMNPlane_[^"]+" bpmnElement="Process_[^"]+">/
      );
      expect(xml).toContain("</bpmndi:BPMNPlane>");
    });

    it("should generate BPMNShape for each node", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain('<bpmndi:BPMNShape id="n0_di" bpmnElement="n0">');
      expect(xml).toContain('<bpmndi:BPMNShape id="n1_di" bpmnElement="n1">');
      expect(xml).toContain('<bpmndi:BPMNShape id="n2_di" bpmnElement="n2">');
    });

    it("should generate dc:Bounds for shapes", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toMatch(
        /<dc:Bounds x="\d+" y="\d+" width="\d+" height="\d+" \/>/
      );
    });

    it("should generate BPMNEdge for each flow", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain(
        '<bpmndi:BPMNEdge id="Flow_n0_n1_di" bpmnElement="Flow_n0_n1">'
      );
      expect(xml).toContain(
        '<bpmndi:BPMNEdge id="Flow_n1_n2_di" bpmnElement="Flow_n1_n2">'
      );
    });

    it("should generate di:waypoint for edges", () => {
      const data = createSimpleProcess();
      const xml = jsonToBpmnXml(data);
      expect(xml).toMatch(/<di:waypoint x="\d+" y="\d+" \/>/);
    });

    it("should escape special XML characters in names", () => {
      const data: BpmnJsonData = {
        bpmn: {
          nodes: [
            { id: "n0", type: "StartEvent", name: "Start" },
            { id: "n1", type: "Task", name: 'Check if A < B & C > D "quoted"' },
            { id: "n2", type: "EndEvent", name: "End" },
          ],
          flows: [
            {
              source: "n0",
              target: "n1",
              type: "SequenceFlow",
              condition: null,
            },
            {
              source: "n1",
              target: "n2",
              type: "SequenceFlow",
              condition: null,
            },
          ],
        },
      };
      const xml = jsonToBpmnXml(data);
      expect(xml).toContain("&lt;");
      expect(xml).toContain("&gt;");
      expect(xml).toContain("&amp;");
      expect(xml).toContain("&quot;");
    });

    it("should handle nodes without names", () => {
      const data: BpmnJsonData = {
        bpmn: {
          nodes: [
            { id: "n0", type: "StartEvent", name: "" },
            { id: "n1", type: "Task", name: "" },
            { id: "n2", type: "EndEvent", name: "" },
          ],
          flows: [
            {
              source: "n0",
              target: "n1",
              type: "SequenceFlow",
              condition: null,
            },
            {
              source: "n1",
              target: "n2",
              type: "SequenceFlow",
              condition: null,
            },
          ],
        },
      };
      const xml = jsonToBpmnXml(data);
      expect(xml).toBeDefined();
      expect(xml.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// CONVERT FUNCTION TESTS
// =============================================================================

describe("JSON to BPMN XML - convertJsonToBpmn", () => {
  it("should return success with valid data", () => {
    const data = createSimpleProcess();
    const result = convertJsonToBpmn(data);
    expect(result.success).toBe(true);
    expect(result.xml).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("should return failure with invalid data", () => {
    const result = convertJsonToBpmn({ invalid: "data" });
    expect(result.success).toBe(false);
    expect(result.xml).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("should handle the full purchase process example", () => {
    const data = createPurchaseProcess();
    const result = convertJsonToBpmn(data);
    expect(result.success).toBe(true);
    expect(result.xml).toBeDefined();

    // Verify all nodes are in the XML
    expect(result.xml).toContain("n0");
    expect(result.xml).toContain("n1");
    expect(result.xml).toContain("n2");
    expect(result.xml).toContain("n3");
    expect(result.xml).toContain("n4");
    expect(result.xml).toContain("n5");
    expect(result.xml).toContain("n6");
    expect(result.xml).toContain("n7");
    expect(result.xml).toContain("n8");
    expect(result.xml).toContain("n9");
    expect(result.xml).toContain("n10");

    // Verify gateway conditions
    expect(result.xml).toContain(">Yes</bpmn:conditionExpression>");
    expect(result.xml).toContain(">No</bpmn:conditionExpression>");

    writeFileSync("purchase-process.xml", result.xml);
    console.log("Purchase process XML saved to purchase-process.xml");
  });
});

// =============================================================================
// NODE TYPE MAPPING TESTS
// =============================================================================

describe("JSON to BPMN XML - Node Type Mapping", () => {
  const testNodeType = (
    type: BpmnNodeJson["type"],
    expectedElement: string
  ) => {
    const data: BpmnJsonData = {
      bpmn: {
        nodes: [
          { id: "start", type: "StartEvent", name: "Start" },
          { id: "test", type: type, name: "Test Node" },
          { id: "end", type: "EndEvent", name: "End" },
        ],
        flows: [
          {
            source: "start",
            target: "test",
            type: "SequenceFlow",
            condition: null,
          },
          {
            source: "test",
            target: "end",
            type: "SequenceFlow",
            condition: null,
          },
        ],
      },
    };
    const xml = jsonToBpmnXml(data);
    expect(xml).toContain(`<${expectedElement} id="test"`);
  };

  it("should map StartEvent correctly", () => {
    testNodeType("StartEvent", "bpmn:startEvent");
  });

  it("should map EndEvent correctly", () => {
    testNodeType("EndEvent", "bpmn:endEvent");
  });

  it("should map Task correctly", () => {
    testNodeType("Task", "bpmn:task");
  });

  it("should map UserTask correctly", () => {
    testNodeType("UserTask", "bpmn:userTask");
  });

  it("should map ServiceTask correctly", () => {
    testNodeType("ServiceTask", "bpmn:serviceTask");
  });

  it("should map ManualTask correctly", () => {
    testNodeType("ManualTask", "bpmn:manualTask");
  });

  it("should map SendTask correctly", () => {
    testNodeType("SendTask", "bpmn:sendTask");
  });

  it("should map ReceiveTask correctly", () => {
    testNodeType("ReceiveTask", "bpmn:receiveTask");
  });

  it("should map ScriptTask correctly", () => {
    testNodeType("ScriptTask", "bpmn:scriptTask");
  });

  it("should map BusinessRuleTask correctly", () => {
    testNodeType("BusinessRuleTask", "bpmn:businessRuleTask");
  });

  it("should map ExclusiveGateway correctly", () => {
    testNodeType("ExclusiveGateway", "bpmn:exclusiveGateway");
  });

  it("should map ParallelGateway correctly", () => {
    testNodeType("ParallelGateway", "bpmn:parallelGateway");
  });

  it("should map InclusiveGateway correctly", () => {
    testNodeType("InclusiveGateway", "bpmn:inclusiveGateway");
  });

  it("should map SubProcess correctly", () => {
    testNodeType("SubProcess", "bpmn:subProcess");
  });
});

// =============================================================================
// LAYOUT TESTS
// =============================================================================

describe("JSON to BPMN XML - Layout", () => {
  it("should assign different x positions for sequential nodes", () => {
    const data = createSimpleProcess();
    const xml = jsonToBpmnXml(data);

    // Extract x values from bounds
    const boundsMatches = xml.matchAll(/x="(\d+)"/g);
    const xValues = Array.from(boundsMatches).map((m) => parseInt(m[1]));

    // Should have different x values for layout
    const uniqueX = Array.from(new Set(xValues));
    expect(uniqueX.length).toBeGreaterThan(1);
  });

  it("should generate waypoints for all flows", () => {
    const data = createProcessWithGateway();
    const xml = jsonToBpmnXml(data);

    // Count waypoints - should have at least 2 per flow (start and end)
    const waypointCount = (xml.match(/<di:waypoint/g) || []).length;
    const flowCount = data.bpmn.flows.length;

    expect(waypointCount).toBeGreaterThanOrEqual(flowCount * 2);
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe("JSON to BPMN XML - Edge Cases", () => {
  it("should handle single-node process (just start and end)", () => {
    const data: BpmnJsonData = {
      bpmn: {
        nodes: [
          { id: "n0", type: "StartEvent", name: "Start" },
          { id: "n1", type: "EndEvent", name: "End" },
        ],
        flows: [
          { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
        ],
      },
    };
    const result = convertJsonToBpmn(data);
    expect(result.success).toBe(true);
  });

  it("should handle parallel gateway with multiple branches", () => {
    const data: BpmnJsonData = {
      bpmn: {
        nodes: [
          { id: "n0", type: "StartEvent", name: "Start" },
          { id: "n1", type: "ParallelGateway", name: "Fork" },
          { id: "n2", type: "Task", name: "Task A" },
          { id: "n3", type: "Task", name: "Task B" },
          { id: "n4", type: "Task", name: "Task C" },
          { id: "n5", type: "ParallelGateway", name: "Join" },
          { id: "n6", type: "EndEvent", name: "End" },
        ],
        flows: [
          { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
          { source: "n1", target: "n2", type: "SequenceFlow", condition: null },
          { source: "n1", target: "n3", type: "SequenceFlow", condition: null },
          { source: "n1", target: "n4", type: "SequenceFlow", condition: null },
          { source: "n2", target: "n5", type: "SequenceFlow", condition: null },
          { source: "n3", target: "n5", type: "SequenceFlow", condition: null },
          { source: "n4", target: "n5", type: "SequenceFlow", condition: null },
          { source: "n5", target: "n6", type: "SequenceFlow", condition: null },
        ],
      },
    };
    const result = convertJsonToBpmn(data);
    expect(result.success).toBe(true);
    expect(result.xml).toContain("bpmn:parallelGateway");
  });

  it("should handle long process names with unicode", () => {
    const data: BpmnJsonData = {
      bpmn: {
        nodes: [
          { id: "n0", type: "StartEvent", name: "Bắt đầu quy trình" },
          {
            id: "n1",
            type: "Task",
            name: "Xử lý đơn hàng với số tiền lớn 日本語",
          },
          { id: "n2", type: "EndEvent", name: "Kết thúc" },
        ],
        flows: [
          { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
          { source: "n1", target: "n2", type: "SequenceFlow", condition: null },
        ],
      },
    };
    const result = convertJsonToBpmn(data);
    expect(result.success).toBe(true);
    expect(result.xml).toContain("Bắt đầu quy trình");
    expect(result.xml).toContain("Kết thúc");
  });
});

// =============================================================================
// ACTIVITY GENERATION TESTS
// =============================================================================

describe("JSON to BPMN XML - Activity Generation", () => {
  const createProcessWithMappings = (): BpmnJsonData => ({
    bpmn: {
      nodes: [
        { id: "n0", type: "StartEvent", name: "Start" },
        { id: "n1", type: "Task", name: "Connect to SAP" },
        { id: "n2", type: "Task", name: "Get Data" },
        { id: "n3", type: "UserTask", name: "Manual Review" },
        { id: "n4", type: "EndEvent", name: "End" },
      ],
      flows: [
        { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
        { source: "n1", target: "n2", type: "SequenceFlow", condition: null },
        { source: "n2", target: "n3", type: "SequenceFlow", condition: null },
        { source: "n3", target: "n4", type: "SequenceFlow", condition: null },
      ],
    },
    mapping: [
      {
        node_id: "n1",
        activity_id: "sap.connect_to_system",
        confidence: 0.95,
        manual_review: false,
        type: "ServiceTask",
        candidates: [
          { activity_id: "sap.connect_to_system", score: 0.95 },
          { activity_id: "sap.get_data", score: 0.8 },
        ],
        input_bindings: { host: "sap.example.com", port: "443" },
        outputs: [],
      },
      {
        node_id: "n2",
        activity_id: "sap.get_business_partner",
        confidence: 0.9,
        manual_review: false,
        type: "ServiceTask",
        candidates: [{ activity_id: "sap.get_business_partner", score: 0.9 }],
        input_bindings: { partnerId: "${partnerVar}" },
        outputs: [],
      },
    ],
  });

  describe("generateActivities", () => {
    it("should generate activities for all nodes", () => {
      const data = createProcessWithMappings();
      const activities = generateActivities(
        data.bpmn.nodes,
        data.bpmn.flows,
        data.mapping
      );

      expect(activities.length).toBe(5); // 5 nodes (n0-n4, no flows with conditions)
      expect(activities.map((a) => a.activityID)).toContain("n0");
      expect(activities.map((a) => a.activityID)).toContain("n1");
      expect(activities.map((a) => a.activityID)).toContain("n2");
      expect(activities.map((a) => a.activityID)).toContain("n3");
      expect(activities.map((a) => a.activityID)).toContain("n4");
    });

    it("should assign correct BPMN types", () => {
      const data = createProcessWithMappings();
      const activities = generateActivities(
        data.bpmn.nodes,
        data.bpmn.flows,
        data.mapping
      );

      const startActivity = activities.find((a) => a.activityID === "n0");
      const taskActivity = activities.find((a) => a.activityID === "n1");
      const userTaskActivity = activities.find((a) => a.activityID === "n3");
      const endActivity = activities.find((a) => a.activityID === "n4");

      expect(startActivity?.activityType).toBe("bpmn:startEvent");
      expect(taskActivity?.activityType).toBe("bpmn:task");
      expect(userTaskActivity?.activityType).toBe("bpmn:userTask");
      expect(endActivity?.activityType).toBe("bpmn:endEvent");
    });

    it("should assign keyword from mapping", () => {
      const data = createProcessWithMappings();
      const activities = generateActivities(
        data.bpmn.nodes,
        data.bpmn.flows,
        data.mapping
      );

      const n1Activity = activities.find((a) => a.activityID === "n1");
      const n2Activity = activities.find((a) => a.activityID === "n2");
      const n3Activity = activities.find((a) => a.activityID === "n3");

      expect(n1Activity?.keyword).toBe("sap.connect_to_system");
      expect(n2Activity?.keyword).toBe("sap.get_business_partner");
      expect(n3Activity?.keyword).toBe(""); // No mapping
    });

    it("should build properties from mapping", () => {
      const data = createProcessWithMappings();
      const activities = generateActivities(
        data.bpmn.nodes,
        data.bpmn.flows,
        data.mapping
      );

      const n1Activity = activities.find((a) => a.activityID === "n1");
      const props = n1Activity?.properties as any;

      expect(props.activityPackage).toBe("sap");
      expect(props.activityName).toBe("connect_to_system");
      expect(props._mapping.confidence).toBe(0.95);
      expect(props._mapping.candidates).toHaveLength(2);
    });

    it("should convert input_bindings to arguments", () => {
      const data = createProcessWithMappings();
      const activities = generateActivities(
        data.bpmn.nodes,
        data.bpmn.flows,
        data.mapping
      );

      const n1Activity = activities.find((a) => a.activityID === "n1");
      const args = (n1Activity?.properties as any).arguments;

      expect(args.host.value).toBe("sap.example.com");
      expect(args.port.value).toBe("443");
    });

    it("should generate activities for conditional flows", () => {
      const data: BpmnJsonData = {
        bpmn: {
          nodes: [
            { id: "n0", type: "StartEvent", name: "Start" },
            { id: "n1", type: "ExclusiveGateway", name: "Decision" },
            { id: "n2", type: "Task", name: "Yes Path" },
            { id: "n3", type: "Task", name: "No Path" },
            { id: "n4", type: "EndEvent", name: "End" },
          ],
          flows: [
            {
              source: "n0",
              target: "n1",
              type: "SequenceFlow",
              condition: null,
            },
            {
              source: "n1",
              target: "n2",
              type: "SequenceFlow",
              condition: "Yes",
            },
            {
              source: "n1",
              target: "n3",
              type: "SequenceFlow",
              condition: "No",
            },
            {
              source: "n2",
              target: "n4",
              type: "SequenceFlow",
              condition: null,
            },
            {
              source: "n3",
              target: "n4",
              type: "SequenceFlow",
              condition: null,
            },
          ],
        },
      };

      const activities = generateActivities(data.bpmn.nodes, data.bpmn.flows);

      // Should include flow activities for conditional flows
      const flowActivities = activities.filter((a) =>
        a.activityID.startsWith("Flow_")
      );
      expect(flowActivities).toHaveLength(2); // Yes and No flows

      const yesFlow = flowActivities.find((a) =>
        a.activityID.includes("n1_n2")
      );
      expect(yesFlow?.activityName).toBe("Yes");
      expect(yesFlow?.activityType).toBe("bpmn:sequenceFlow");
    });

    it("should handle nodes without mapping", () => {
      const data: BpmnJsonData = {
        bpmn: {
          nodes: [
            { id: "n0", type: "StartEvent", name: "Start" },
            { id: "n1", type: "Task", name: "Task without mapping" },
            { id: "n2", type: "EndEvent", name: "End" },
          ],
          flows: [
            {
              source: "n0",
              target: "n1",
              type: "SequenceFlow",
              condition: null,
            },
            {
              source: "n1",
              target: "n2",
              type: "SequenceFlow",
              condition: null,
            },
          ],
        },
        // No mapping provided
      };

      const activities = generateActivities(data.bpmn.nodes, data.bpmn.flows);

      expect(activities).toHaveLength(3);
      const n1Activity = activities.find((a) => a.activityID === "n1");
      expect(n1Activity?.keyword).toBe("");
      expect(n1Activity?.properties).toEqual({});
    });
  });
});

// =============================================================================
// COMPLETE CONVERTER TESTS
// =============================================================================

describe("JSON to BPMN XML - convertJsonToProcess", () => {
  const createFullProcess = (): BpmnJsonData => ({
    bpmn: {
      nodes: [
        { id: "n0", type: "StartEvent", name: "Start Purchase Process" },
        { id: "n1", type: "Task", name: "Connect to SAP" },
        { id: "n2", type: "ExclusiveGateway", name: "Amount > 5000?" },
        { id: "n3", type: "Task", name: "High Value Path" },
        { id: "n4", type: "Task", name: "Low Value Path" },
        { id: "n5", type: "ExclusiveGateway", name: "Join" },
        { id: "n6", type: "EndEvent", name: "End" },
      ],
      flows: [
        { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
        { source: "n1", target: "n2", type: "SequenceFlow", condition: null },
        { source: "n2", target: "n3", type: "SequenceFlow", condition: "Yes" },
        { source: "n2", target: "n4", type: "SequenceFlow", condition: "No" },
        { source: "n3", target: "n5", type: "SequenceFlow", condition: null },
        { source: "n4", target: "n5", type: "SequenceFlow", condition: null },
        { source: "n5", target: "n6", type: "SequenceFlow", condition: null },
      ],
    },
    mapping: [
      {
        node_id: "n1",
        activity_id: "sap.connect",
        confidence: 0.95,
        manual_review: false,
        type: "ServiceTask",
        candidates: [],
        input_bindings: { host: "sap.example.com" },
        outputs: [],
      },
      {
        node_id: "n3",
        activity_id: "sap.create_purchase_order",
        confidence: 0.88,
        manual_review: true,
        type: "ServiceTask",
        candidates: [],
        input_bindings: {},
        outputs: [],
      },
    ],
  });

  it("should return success with all data", () => {
    const data = createFullProcess();
    const result = convertJsonToProcess(data);

    expect(result.success).toBe(true);
    expect(result.xml).toBeDefined();
    expect(result.activities).toBeDefined();
    expect(result.variables).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("should return valid XML", () => {
    const data = createFullProcess();
    const result = convertJsonToProcess(data);

    expect(result.xml).toMatch(/^<\?xml version="1\.0"/);
    expect(result.xml).toContain("<bpmn:definitions");
    expect(result.xml).toContain("<bpmn:process");
    expect(result.xml).toContain("</bpmn:definitions>");
  });

  it("should return activities with correct count", () => {
    const data = createFullProcess();
    const result = convertJsonToProcess(data);

    // 7 nodes + 2 conditional flows = 9 activities
    expect(result.activities?.length).toBe(9);
  });

  it("should return activities with mapped keywords", () => {
    const data = createFullProcess();
    const result = convertJsonToProcess(data);

    const n1Activity = result.activities?.find((a) => a.activityID === "n1");
    const n3Activity = result.activities?.find((a) => a.activityID === "n3");

    expect(n1Activity?.keyword).toBe("sap.connect");
    expect(n3Activity?.keyword).toBe("sap.create_purchase_order");
  });

  it("should return empty variables array (placeholder)", () => {
    const data = createFullProcess();
    const result = convertJsonToProcess(data);

    expect(result.variables).toEqual([]);
  });

  it("should return errors for invalid data", () => {
    const result = convertJsonToProcess({ invalid: "data" });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.xml).toBeUndefined();
    expect(result.activities).toBeUndefined();
  });

  it("should accept layout options", () => {
    const data = createFullProcess();
    const result = convertJsonToProcess(data, {
      horizontalSpacing: 250,
      verticalSpacing: 150,
      startX: 100,
      startY: 100,
    });

    expect(result.success).toBe(true);
    // Check that layout was applied (positions should reflect custom spacing)
    expect(result.xml).toContain('x="100"');
  });
});

// =============================================================================
// IMPROVED LAYOUT TESTS (NO OVERLAP)
// =============================================================================

describe("JSON to BPMN XML - Improved Layout (No Overlap)", () => {
  it("should position branch nodes at different Y levels", () => {
    const data: BpmnJsonData = {
      bpmn: {
        nodes: [
          { id: "n0", type: "StartEvent", name: "Start" },
          { id: "n1", type: "ExclusiveGateway", name: "Decision" },
          { id: "n2", type: "Task", name: "Branch A" },
          { id: "n3", type: "Task", name: "Branch B" },
          { id: "n4", type: "ExclusiveGateway", name: "Join" },
          { id: "n5", type: "EndEvent", name: "End" },
        ],
        flows: [
          { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
          { source: "n1", target: "n2", type: "SequenceFlow", condition: "A" },
          { source: "n1", target: "n3", type: "SequenceFlow", condition: "B" },
          { source: "n2", target: "n4", type: "SequenceFlow", condition: null },
          { source: "n3", target: "n4", type: "SequenceFlow", condition: null },
          { source: "n4", target: "n5", type: "SequenceFlow", condition: null },
        ],
      },
    };

    const xml = jsonToBpmnXml(data);

    // Extract Y positions for n2 and n3 (branch nodes)
    const n2Match = xml.match(
      /<bpmndi:BPMNShape id="n2_di"[^>]*>[\s\S]*?<dc:Bounds[^>]*y="(\d+)"/
    );
    const n3Match = xml.match(
      /<bpmndi:BPMNShape id="n3_di"[^>]*>[\s\S]*?<dc:Bounds[^>]*y="(\d+)"/
    );

    expect(n2Match).not.toBeNull();
    expect(n3Match).not.toBeNull();

    const n2Y = parseInt(n2Match![1]);
    const n3Y = parseInt(n3Match![1]);

    // Branch nodes should have different Y positions
    expect(n2Y).not.toBe(n3Y);
    // The difference should be significant (at least spacing)
    expect(Math.abs(n2Y - n3Y)).toBeGreaterThanOrEqual(100);
  });

  it("should position three-way branches without overlap", () => {
    const data: BpmnJsonData = {
      bpmn: {
        nodes: [
          { id: "n0", type: "StartEvent", name: "Start" },
          { id: "n1", type: "ParallelGateway", name: "Fork" },
          { id: "n2", type: "Task", name: "Branch 1" },
          { id: "n3", type: "Task", name: "Branch 2" },
          { id: "n4", type: "Task", name: "Branch 3" },
          { id: "n5", type: "ParallelGateway", name: "Join" },
          { id: "n6", type: "EndEvent", name: "End" },
        ],
        flows: [
          { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
          { source: "n1", target: "n2", type: "SequenceFlow", condition: null },
          { source: "n1", target: "n3", type: "SequenceFlow", condition: null },
          { source: "n1", target: "n4", type: "SequenceFlow", condition: null },
          { source: "n2", target: "n5", type: "SequenceFlow", condition: null },
          { source: "n3", target: "n5", type: "SequenceFlow", condition: null },
          { source: "n4", target: "n5", type: "SequenceFlow", condition: null },
          { source: "n5", target: "n6", type: "SequenceFlow", condition: null },
        ],
      },
    };

    const xml = jsonToBpmnXml(data);

    // Extract Y positions for branch nodes
    const yPositions: number[] = [];
    ["n2", "n3", "n4"].forEach((nodeId) => {
      const match = xml.match(
        new RegExp(
          `<bpmndi:BPMNShape id="${nodeId}_di"[^>]*>[\\s\\S]*?<dc:Bounds[^>]*y="(\\d+)"`
        )
      );
      if (match) {
        yPositions.push(parseInt(match[1]));
      }
    });

    expect(yPositions.length).toBe(3);

    // All Y positions should be unique
    const uniqueY = Array.from(new Set(yPositions));
    expect(uniqueY.length).toBe(3);

    // Check minimum spacing between branches
    yPositions.sort((a, b) => a - b);
    for (let i = 1; i < yPositions.length; i++) {
      const spacing = yPositions[i] - yPositions[i - 1];
      expect(spacing).toBeGreaterThanOrEqual(80); // At least task height
    }
  });

  it("should center join gateway between incoming branches", () => {
    const data: BpmnJsonData = {
      bpmn: {
        nodes: [
          { id: "n0", type: "StartEvent", name: "Start" },
          { id: "n1", type: "ExclusiveGateway", name: "Split" },
          { id: "n2", type: "Task", name: "Top Branch" },
          { id: "n3", type: "Task", name: "Bottom Branch" },
          { id: "n4", type: "ExclusiveGateway", name: "Join" },
          { id: "n5", type: "EndEvent", name: "End" },
        ],
        flows: [
          { source: "n0", target: "n1", type: "SequenceFlow", condition: null },
          {
            source: "n1",
            target: "n2",
            type: "SequenceFlow",
            condition: "Top",
          },
          {
            source: "n1",
            target: "n3",
            type: "SequenceFlow",
            condition: "Bottom",
          },
          { source: "n2", target: "n4", type: "SequenceFlow", condition: null },
          { source: "n3", target: "n4", type: "SequenceFlow", condition: null },
          { source: "n4", target: "n5", type: "SequenceFlow", condition: null },
        ],
      },
    };

    const xml = jsonToBpmnXml(data);

    // Extract Y positions
    const getY = (nodeId: string): number | null => {
      const match = xml.match(
        new RegExp(
          `<bpmndi:BPMNShape id="${nodeId}_di"[^>]*>[\\s\\S]*?<dc:Bounds[^>]*y="(\\d+)"`
        )
      );
      return match ? parseInt(match[1]) : null;
    };

    const n2Y = getY("n2");
    const n3Y = getY("n3");
    const n4Y = getY("n4");

    expect(n2Y).not.toBeNull();
    expect(n3Y).not.toBeNull();
    expect(n4Y).not.toBeNull();

    // Join gateway (n4) should be approximately centered
    const expectedCenter = (n2Y! + n3Y!) / 2;
    expect(Math.abs(n4Y! - expectedCenter)).toBeLessThan(30);
  });
});
