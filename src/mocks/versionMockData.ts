import {
  Version,
  VersionChange,
  VersionCompareResult,
} from "@/interfaces/version";

// Sample BPMN XML for version 1 (older) - Simple valid BPMN without Zeebe extensions
const sampleXmlV1 = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Request Submitted">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_ReviewRequest" name="Review Request">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Request Approved?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_Yes</bpmn:outgoing>
      <bpmn:outgoing>Flow_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_CreateInvoice" name="Create Invoice">
      <bpmn:incoming>Flow_Yes</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_NotifyClient" name="Notify Client">
      <bpmn:incoming>Flow_No</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Process Completed">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_ReviewRequest" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_ReviewRequest" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_Yes" name="Yes" sourceRef="Gateway_1" targetRef="Task_CreateInvoice" />
    <bpmn:sequenceFlow id="Flow_No" name="No" sourceRef="Gateway_1" targetRef="Task_NotifyClient" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_CreateInvoice" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_NotifyClient" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="130" y="145" width="80" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_ReviewRequest_di" bpmnElement="Task_ReviewRequest">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true">
        <dc:Bounds x="395" y="95" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="375" y="65" width="90" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CreateInvoice_di" bpmnElement="Task_CreateInvoice">
        <dc:Bounds x="500" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_NotifyClient_di" bpmnElement="Task_NotifyClient">
        <dc:Bounds x="500" y="200" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="662" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="640" y="145" width="80" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="395" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Yes_di" bpmnElement="Flow_Yes">
        <di:waypoint x="445" y="120" />
        <di:waypoint x="500" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_No_di" bpmnElement="Flow_No">
        <di:waypoint x="420" y="145" />
        <di:waypoint x="420" y="240" />
        <di:waypoint x="500" y="240" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="600" y="120" />
        <di:waypoint x="662" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="600" y="240" />
        <di:waypoint x="680" y="240" />
        <di:waypoint x="680" y="138" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

// Sample BPMN XML for version 2 (newer - with additional task)
const sampleXmlV2 = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Request Submitted">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_ReviewRequest" name="Review Request">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Request Approved?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_Yes</bpmn:outgoing>
      <bpmn:outgoing>Flow_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_ValidateData" name="Validate Data">
      <bpmn:incoming>Flow_Yes</bpmn:incoming>
      <bpmn:outgoing>Flow_Validate</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_CreateInvoice" name="Create Invoice">
      <bpmn:incoming>Flow_Validate</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_NotifyClient" name="Notify Client - Updated">
      <bpmn:incoming>Flow_No</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Process Completed">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_ReviewRequest" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_ReviewRequest" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_Yes" name="Yes" sourceRef="Gateway_1" targetRef="Task_ValidateData" />
    <bpmn:sequenceFlow id="Flow_Validate" sourceRef="Task_ValidateData" targetRef="Task_CreateInvoice" />
    <bpmn:sequenceFlow id="Flow_No" name="No" sourceRef="Gateway_1" targetRef="Task_NotifyClient" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_CreateInvoice" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_NotifyClient" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="130" y="145" width="80" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_ReviewRequest_di" bpmnElement="Task_ReviewRequest">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true">
        <dc:Bounds x="395" y="95" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="375" y="65" width="90" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_ValidateData_di" bpmnElement="Task_ValidateData">
        <dc:Bounds x="500" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CreateInvoice_di" bpmnElement="Task_CreateInvoice">
        <dc:Bounds x="650" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_NotifyClient_di" bpmnElement="Task_NotifyClient">
        <dc:Bounds x="500" y="200" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="812" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="790" y="145" width="80" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="395" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Yes_di" bpmnElement="Flow_Yes">
        <di:waypoint x="445" y="120" />
        <di:waypoint x="500" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Validate_di" bpmnElement="Flow_Validate">
        <di:waypoint x="600" y="120" />
        <di:waypoint x="650" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_No_di" bpmnElement="Flow_No">
        <di:waypoint x="420" y="145" />
        <di:waypoint x="420" y="240" />
        <di:waypoint x="500" y="240" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="750" y="120" />
        <di:waypoint x="812" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="600" y="240" />
        <di:waypoint x="830" y="240" />
        <di:waypoint x="830" y="138" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export const mockVersions: Version[] = [
  {
    id: "version-1",
    tag: "v2.0",
    description: "Added validation step before invoice creation",
    createdBy: {
      id: "user-1",
      name: "Chieens",
      email: "chieens@example.com",
    },
    createdAt: "2025-11-05T14:48:00.000Z",
    processId: "process-1",
    xml: sampleXmlV2,
    variables: {},
    activities: [],
    isCurrent: true,
  },
  {
    id: "version-2",
    tag: "v1.0",
    description: "Initial workflow version",
    createdBy: {
      id: "user-2",
      name: "Chiens",
      email: "chiens@example.com",
    },
    createdAt: "2025-11-05T10:30:00.000Z",
    processId: "process-1",
    xml: sampleXmlV1,
    variables: {},
    activities: [],
  },
  {
    id: "version-3",
    tag: "Autosaved",
    description: "Autosaved before Copilot (AI generation)",
    createdBy: {
      id: "user-2",
      name: "Chiens",
      email: "chiens@example.com",
    },
    createdAt: "2025-11-04T14:48:00.000Z",
    processId: "process-1",
    xml: sampleXmlV1,
    variables: {},
    activities: [],
  },
];

export const mockChanges: VersionChange[] = [
  {
    id: "change-1",
    elementId: "Task_ValidateData",
    elementName: "Validate Data",
    changeType: "added",
    details: "New task added",
  },
  {
    id: "change-2",
    elementId: "Task_NotifyClient",
    elementName: "Notify Client - Updated",
    changeType: "changed",
    details: 'Name changed from "Notify Client"',
  },
  {
    id: "change-3",
    elementId: "Flow_Validate",
    elementName: "Flow_Validate",
    changeType: "added",
    details: "New flow added",
  },
];

export const mockCompareResult: VersionCompareResult = {
  baseVersion: mockVersions[1],
  compareVersion: mockVersions[0],
  changes: mockChanges,
  addedCount: 2,
  changedCount: 1,
  movedCount: 0,
  removedCount: 0,
};

// Helper function to get versions grouped by date
export function getVersionsGroupedByDate(
  versions: Version[]
): Record<string, Version[]> {
  const grouped: Record<string, Version[]> = {};

  versions.forEach((version) => {
    const date = new Date(version.createdAt);
    const dateKey = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(version);
  });

  return grouped;
}

// Helper to format time
export function formatVersionTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
