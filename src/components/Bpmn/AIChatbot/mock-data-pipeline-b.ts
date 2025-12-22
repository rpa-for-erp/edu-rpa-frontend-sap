/**
 * Mock data for testing Scenario B Pipeline
 * This file contains example pipeline responses
 */

import { PipelineResponse } from "@/apis/chatbotApi";

// ============================================================================
// Mock BPMN Structures
// ============================================================================

export const mockBpmnStructure = {
  nodes: [
    {
      id: "StartEvent_1",
      type: "StartEvent",
      name: "Start",
    },
    {
      id: "Task_SendEmail",
      type: "SendTask",
      name: "Send Email to Finance",
    },
    {
      id: "Task_AttachQuotation",
      type: "ServiceTask",
      name: "Attach Quotation",
    },
    {
      id: "Task_WaitReply",
      type: "ReceiveTask",
      name: "Wait for Reply",
    },
    {
      id: "Task_UpdateInvoice",
      type: "ServiceTask",
      name: "Update Invoice in SAP",
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
      target: "Task_SendEmail",
      type: "SequenceFlow",
      condition: null,
    },
    {
      source: "Task_SendEmail",
      target: "Task_AttachQuotation",
      type: "SequenceFlow",
      condition: null,
    },
    {
      source: "Task_AttachQuotation",
      target: "Task_WaitReply",
      type: "SequenceFlow",
      condition: null,
    },
    {
      source: "Task_WaitReply",
      target: "Task_UpdateInvoice",
      type: "SequenceFlow",
      condition: null,
    },
    {
      source: "Task_UpdateInvoice",
      target: "EndEvent_1",
      type: "SequenceFlow",
      condition: null,
    },
  ],
};

export const mockActivityMapping = [
  {
    node_id: "Task_SendEmail",
    activity_id: "email.send",
    confidence: 0.95,
    manual_review: false,
    type: "SendTask",
    candidates: [
      { activity_id: "email.send", score: 0.95 },
      { activity_id: "email.sendWithAttachment", score: 0.88 },
    ],
    input_bindings: {
      to: "${financeEmail}",
      subject: "Quotation Request",
      body: "${emailBody}",
    },
    outputs: ["messageId", "sentAt"],
  },
  {
    node_id: "Task_AttachQuotation",
    activity_id: "document.attach",
    confidence: 0.92,
    manual_review: false,
    type: "ServiceTask",
    candidates: [
      { activity_id: "document.attach", score: 0.92 },
      { activity_id: "file.upload", score: 0.85 },
    ],
    input_bindings: {
      documentId: "${quotationId}",
      targetEmail: "${financeEmail}",
    },
    outputs: ["attachmentId"],
  },
  {
    node_id: "Task_WaitReply",
    activity_id: "email.waitForReply",
    confidence: 0.89,
    manual_review: false,
    type: "ReceiveTask",
    candidates: [
      { activity_id: "email.waitForReply", score: 0.89 },
      { activity_id: "email.receive", score: 0.82 },
    ],
    input_bindings: {
      fromEmail: "${financeEmail}",
      timeout: 3600,
    },
    outputs: ["replyBody", "replyAttachments"],
  },
  {
    node_id: "Task_UpdateInvoice",
    activity_id: "sap.updateInvoice",
    confidence: 0.97,
    manual_review: false,
    type: "ServiceTask",
    candidates: [
      { activity_id: "sap.updateInvoice", score: 0.97 },
      { activity_id: "sap.createInvoice", score: 0.85 },
    ],
    input_bindings: {
      invoiceId: "${invoiceId}",
      status: "approved",
      updatedData: "${replyBody}",
    },
    outputs: ["updatedInvoiceId", "updateTimestamp"],
  },
];

// ============================================================================
// Mock Pipeline Responses
// ============================================================================

/**
 * Step 1: Pipeline started - BPMN feedback needed
 */
export const mockPipelineStartResponse: PipelineResponse = {
  thread_id: "mock-thread-123",
  status: "waiting_feedback",
  interrupt: {
    type: "bpmn_feedback",
    instruction:
      "I've generated a BPMN structure for your process. Please review and approve or provide feedback.",
    bpmn: mockBpmnStructure,
    draft_snapshot: {},
  },
  state: {
    text: "Send an email to finance, attach the quotation, wait for reply, then update the invoice in the SAP system.",
  },
};

/**
 * Step 2: BPMN approved - Mapping feedback needed
 */
export const mockMappingFeedbackResponse: PipelineResponse = {
  thread_id: "mock-thread-123",
  status: "waiting_feedback",
  interrupt: {
    type: "mapping_feedback",
    instruction:
      "I've mapped activities to the BPMN nodes. Please review the activity mappings.",
    mapping: mockActivityMapping,
    bpmn: mockBpmnStructure,
  },
  state: {
    text: "Send an email to finance, attach the quotation, wait for reply, then update the invoice in the SAP system.",
    bpmn: mockBpmnStructure,
  },
};

/**
 * Step 3: Mapping approved - Pipeline completed
 */
export const mockPipelineCompletedResponse: PipelineResponse = {
  thread_id: "mock-thread-123",
  status: "completed",
  state: {
    text: "Send an email to finance, attach the quotation, wait for reply, then update the invoice in the SAP system.",
    bpmn: mockBpmnStructure,
    mapping: mockActivityMapping,
  },
  render_xml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_mock" 
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_mock" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:sendTask id="Task_SendEmail" name="Send Email to Finance">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:sendTask>
    <bpmn:serviceTask id="Task_AttachQuotation" name="Attach Quotation">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:receiveTask id="Task_WaitReply" name="Wait for Reply">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:receiveTask>
    <bpmn:serviceTask id="Task_UpdateInvoice" name="Update Invoice in SAP">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_5</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_SendEmail" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_SendEmail" targetRef="Task_AttachQuotation" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_AttachQuotation" targetRef="Task_WaitReply" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_WaitReply" targetRef="Task_UpdateInvoice" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_UpdateInvoice" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>`,
  render_activities: [
    {
      activityID: "Task_SendEmail",
      activityName: "Send Email to Finance",
      activityType: "bpmn:sendTask",
      keyword: "email.send",
      properties: {
        activityPackage: "email",
        activityName: "send",
        serviceName: "email",
        arguments: {
          to: {
            type: "string",
            value: "${financeEmail}",
          },
          subject: {
            type: "string",
            value: "Quotation Request",
          },
          body: {
            type: "string",
            value: "${emailBody}",
          },
        },
        assigns: ["messageId", "sentAt"],
      },
    },
    {
      activityID: "Task_AttachQuotation",
      activityName: "Attach Quotation",
      activityType: "bpmn:serviceTask",
      keyword: "document.attach",
      properties: {
        activityPackage: "document",
        activityName: "attach",
        serviceName: "document",
        arguments: {
          documentId: {
            type: "string",
            value: "${quotationId}",
          },
          targetEmail: {
            type: "string",
            value: "${financeEmail}",
          },
        },
        assigns: ["attachmentId"],
      },
    },
    {
      activityID: "Task_WaitReply",
      activityName: "Wait for Reply",
      activityType: "bpmn:receiveTask",
      keyword: "email.waitForReply",
      properties: {
        activityPackage: "email",
        activityName: "waitForReply",
        serviceName: "email",
        arguments: {
          fromEmail: {
            type: "string",
            value: "${financeEmail}",
          },
          timeout: {
            type: "number",
            value: "3600",
          },
        },
        assigns: ["replyBody", "replyAttachments"],
      },
    },
    {
      activityID: "Task_UpdateInvoice",
      activityName: "Update Invoice in SAP",
      activityType: "bpmn:serviceTask",
      keyword: "sap.updateInvoice",
      properties: {
        activityPackage: "sap",
        activityName: "updateInvoice",
        serviceName: "sap",
        arguments: {
          invoiceId: {
            type: "string",
            value: "${invoiceId}",
          },
          status: {
            type: "string",
            value: "approved",
          },
          updatedData: {
            type: "string",
            value: "${replyBody}",
          },
        },
        assigns: ["updatedInvoiceId", "updateTimestamp"],
      },
    },
  ],
};

/**
 * Example of rejected BPMN feedback
 */
export const mockBpmnRejectedResponse: PipelineResponse = {
  thread_id: "mock-thread-123",
  status: "waiting_feedback",
  interrupt: {
    type: "bpmn_feedback",
    instruction:
      "I've regenerated the BPMN structure based on your feedback. Please review again.",
    bpmn: mockBpmnStructure,
    draft_snapshot: {},
  },
  state: {
    text: "Send an email to finance, attach the quotation, wait for reply, then update the invoice in the SAP system.",
    user_feedback_text: "Please add error handling for email sending",
  },
};

/**
 * Example of rejected mapping feedback
 */
export const mockMappingRejectedResponse: PipelineResponse = {
  thread_id: "mock-thread-123",
  status: "waiting_feedback",
  interrupt: {
    type: "mapping_feedback",
    instruction:
      "I've remapped the activities based on your feedback. Please review again.",
    mapping: mockActivityMapping,
    bpmn: mockBpmnStructure,
  },
  state: {
    text: "Send an email to finance, attach the quotation, wait for reply, then update the invoice in the SAP system.",
    bpmn: mockBpmnStructure,
    user_mapping_feedback_text:
      "The activity mapping for Task_SendEmail is incorrect",
  },
};

// ============================================================================
// Example Prompts
// ============================================================================

export const examplePrompts = [
  "Send an email to finance, attach the quotation, wait for reply, then update the invoice in the SAP system.",
  "Create a customer onboarding process: collect documents, verify identity, create account, send welcome email.",
  "Build a purchase order workflow: submit request, manager approval, create PO in system, notify supplier.",
  "Generate an invoice approval process: receive invoice, validate data, get approval, update accounting system.",
  "Create a leave request workflow: employee submits, manager reviews, HR approves, update calendar system.",
];
