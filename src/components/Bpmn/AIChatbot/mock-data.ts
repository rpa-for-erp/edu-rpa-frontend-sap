/**
 * Mock data for testing AI Chatbot BPMN generation
 * This file contains example BPMN JSON responses from the backend
 */

export const mockPurchaseApprovalProcess = {
  bpmn: {
    nodes: [
      {
        id: "StartEvent_1",
        type: "StartEvent",
        name: "Purchase Request Submitted",
      },
      {
        id: "Task_ReviewRequest",
        type: "UserTask",
        name: "Review Request",
      },
      {
        id: "Gateway_Approved",
        type: "ExclusiveGateway",
        name: "Approved?",
      },
      {
        id: "Task_CreateInvoice",
        type: "ServiceTask",
        name: "Create Invoice",
      },
      {
        id: "Task_NotifyClient",
        type: "SendTask",
        name: "Notify Client",
      },
      {
        id: "Task_RejectRequest",
        type: "UserTask",
        name: "Reject Request",
      },
      {
        id: "EndEvent_Success",
        type: "EndEvent",
        name: "Request Approved",
      },
      {
        id: "EndEvent_Rejected",
        type: "EndEvent",
        name: "Request Rejected",
      },
    ],
    flows: [
      {
        source: "StartEvent_1",
        target: "Task_ReviewRequest",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Task_ReviewRequest",
        target: "Gateway_Approved",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Gateway_Approved",
        target: "Task_CreateInvoice",
        type: "SequenceFlow",
        condition: "approved == true",
      },
      {
        source: "Gateway_Approved",
        target: "Task_RejectRequest",
        type: "SequenceFlow",
        condition: "approved == false",
      },
      {
        source: "Task_CreateInvoice",
        target: "Task_NotifyClient",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Task_NotifyClient",
        target: "EndEvent_Success",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Task_RejectRequest",
        target: "EndEvent_Rejected",
        type: "SequenceFlow",
        condition: null,
      },
    ],
  },
  mapping: [
    {
      node_id: "Task_ReviewRequest",
      activity_id: "humanTask.reviewRequest",
      confidence: 0.92,
      manual_review: false,
      type: "UserTask",
      candidates: [
        { activity_id: "humanTask.reviewRequest", score: 0.92 },
        { activity_id: "humanTask.approveRequest", score: 0.85 },
      ],
      input_bindings: {
        requestId: "${requestId}",
        requestType: "purchase",
      },
      outputs: ["approved", "comments"],
    },
    {
      node_id: "Task_CreateInvoice",
      activity_id: "invoice.createInvoice",
      confidence: 0.95,
      manual_review: false,
      type: "ServiceTask",
      candidates: [
        { activity_id: "invoice.createInvoice", score: 0.95 },
        { activity_id: "invoice.generateInvoice", score: 0.88 },
      ],
      input_bindings: {
        requestId: "${requestId}",
        amount: "${amount}",
        clientId: "${clientId}",
      },
      outputs: ["invoiceId", "invoiceNumber"],
    },
    {
      node_id: "Task_NotifyClient",
      activity_id: "notification.sendEmail",
      confidence: 0.89,
      manual_review: false,
      type: "SendTask",
      candidates: [
        { activity_id: "notification.sendEmail", score: 0.89 },
        { activity_id: "notification.sendNotification", score: 0.82 },
      ],
      input_bindings: {
        to: "${clientEmail}",
        subject: "Purchase Request Approved",
        body: "Your purchase request has been approved.",
      },
      outputs: [],
    },
  ],
};

export const mockSimpleProcess = {
  bpmn: {
    nodes: [
      {
        id: "StartEvent_1",
        type: "StartEvent",
        name: "Start",
      },
      {
        id: "Task_1",
        type: "Task",
        name: "Process Data",
      },
      {
        id: "EndEvent_1",
        type: "EndEvent",
        name: "End",
      },
    ],
    flows: [
      {
        source: "StartEvent_1",
        target: "Task_1",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Task_1",
        target: "EndEvent_1",
        type: "SequenceFlow",
        condition: null,
      },
    ],
  },
};

export const mockParallelProcess = {
  bpmn: {
    nodes: [
      {
        id: "StartEvent_1",
        type: "StartEvent",
        name: "Start",
      },
      {
        id: "Gateway_Split",
        type: "ParallelGateway",
        name: "Split",
      },
      {
        id: "Task_A",
        type: "Task",
        name: "Task A",
      },
      {
        id: "Task_B",
        type: "Task",
        name: "Task B",
      },
      {
        id: "Gateway_Join",
        type: "ParallelGateway",
        name: "Join",
      },
      {
        id: "EndEvent_1",
        type: "EndEvent",
        name: "End",
      },
    ],
    flows: [
      {
        source: "StartEvent_1",
        target: "Gateway_Split",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Gateway_Split",
        target: "Task_A",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Gateway_Split",
        target: "Task_B",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Task_A",
        target: "Gateway_Join",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Task_B",
        target: "Gateway_Join",
        type: "SequenceFlow",
        condition: null,
      },
      {
        source: "Gateway_Join",
        target: "EndEvent_1",
        type: "SequenceFlow",
        condition: null,
      },
    ],
  },
};

// Mock API responses
export const mockChatbotResponses = {
  purchaseApproval: {
    conversationId: "conv-123",
    message: `I've created a purchase approval process with the following steps:

1. **Start Event:** The process begins when a user submits a request.
2. **User Task:** The manager reviews it. If approved, create an invoice and notify the client.
3. **Exclusive Gateway:** The decision 'if approved' requires a branching point. I'll use a 'bpmn:exclusiveGateway' named 'Request Approved?'.
4. **Approval Path:**
   - If the request is approved, two things happen: 'create an invoice' and 'notify the client'. These can happen in parallel.
   - I'll use a 'bpmn:parallelGateway' to split the flow.
   
This structure accurately reflects the user's request using standard BPMN elements and correctly configured connectors.`,
    bpmnJson: mockPurchaseApprovalProcess,
    requiresConfirmation: true,
    confirmationType: "apply_bpmn",
  },

  simpleProcess: {
    conversationId: "conv-124",
    message: "I've created a simple linear process with one task.",
    bpmnJson: mockSimpleProcess,
    requiresConfirmation: true,
    confirmationType: "apply_bpmn",
  },

  parallelProcess: {
    conversationId: "conv-125",
    message: `I've created a process with parallel execution:

- Tasks A and B will execute simultaneously
- Both must complete before the process ends`,
    bpmnJson: mockParallelProcess,
    requiresConfirmation: true,
    confirmationType: "apply_bpmn",
  },
};

// Example prompts for testing
export const examplePrompts = [
  "Create a purchase approval process",
  "Generate a simple task workflow",
  "Make a parallel process with two tasks",
  "Create an invoice approval workflow with email notifications",
  "Generate a customer onboarding process",
  "Build a document review process with approval stages",
];
