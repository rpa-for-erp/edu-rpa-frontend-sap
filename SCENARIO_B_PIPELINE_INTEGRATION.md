# 🚀 Scenario B Pipeline Integration - Complete Guide

## 📋 Overview

The AI Chatbot has been fully integrated with the **Scenario B Pipeline** FastAPI backend. This pipeline provides a sophisticated workflow with two user feedback checkpoints for generating BPMN processes with automatic activity mapping.

## 🎯 Features

### ✅ Implemented

1. **Two-Stage Feedback Workflow**

   - **Stage 1**: BPMN Structure Review (approve/reject with feedback)
   - **Stage 2**: Activity Mapping Review (approve/reject with feedback)

2. **Real-time Pipeline Status**

   - Visual status badges (Ready, Processing, Awaiting Approval, Completed)
   - Live progress tracking
   - Error handling and retry logic

3. **Rich User Experience**

   - Conversational interface with clear instructions
   - Textarea for providing detailed feedback on rejection
   - Visual confirmation buttons (Approve/Reject)
   - Final "Apply to Canvas" action

4. **Automatic BPMN Application**
   - Converts pipeline output to BPMN XML
   - Applies to canvas with activity mappings
   - Syncs to localStorage
   - Marks process as unsaved for user to save

## 🔌 API Integration

### Endpoints Used

#### 1. Start Pipeline

**POST** `/pipeline/b/start`

```typescript
chatbotApi.startPipeline(text: string, options?: Record<string, any>)
```

**Returns:**

- `thread_id`: Unique identifier for this pipeline run
- `status`: "waiting_feedback"
- `interrupt`: BPMN feedback request

#### 2. Submit Feedback

**POST** `/pipeline/b/feedback/{thread_id}`

```typescript
// BPMN Feedback
chatbotApi.submitFeedback(threadId, {
  user_decision: "approve" | "reject",
  user_feedback_text: string,
});

// Mapping Feedback
chatbotApi.submitFeedback(threadId, {
  user_mapping_decision: "approve" | "reject",
  user_mapping_feedback_text: string,
});
```

#### 3. Get Pipeline Status (Optional)

**GET** `/pipeline/b/status/{thread_id}`

```typescript
chatbotApi.getPipelineStatus(threadId);
```

#### 4. Get Pending Feedback (Optional)

**GET** `/pipeline/b/feedback/{thread_id}`

```typescript
chatbotApi.getPendingFeedback(threadId);
```

## 📊 Workflow Diagram

```
┌─────────────────────────────────────────────────────┐
│ 1. User Input                                       │
│    "Send email to finance, attach quotation..."     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. POST /pipeline/b/start                           │
│    Returns: thread_id + BPMN Feedback Interrupt     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. BPMN Feedback Stage                              │
│    - Display: Generated BPMN structure              │
│    - User Actions:                                  │
│      • Approve → Continue to mapping                │
│      • Reject + Feedback → Regenerate BPMN         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. POST /pipeline/b/feedback/{thread_id}            │
│    Body: { user_decision: "approve" }               │
│    Returns: Mapping Feedback Interrupt              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. Mapping Feedback Stage                           │
│    - Display: Activity mappings with confidence     │
│    - User Actions:                                  │
│      • Approve → Validate and render                │
│      • Reject + Feedback → Remap activities        │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. POST /pipeline/b/feedback/{thread_id}            │
│    Body: { user_mapping_decision: "approve" }       │
│    Returns: Completed with render_xml               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 7. Apply to Canvas                                  │
│    - Convert to BPMN XML                            │
│    - Import to modeler                              │
│    - Save to localStorage                           │
│    - Mark as unsaved                                │
└─────────────────────────────────────────────────────┘
```

## 🎨 UI Components

### Status Badge

Shows current pipeline stage:

- **Gray "Ready"**: Idle, waiting for user input
- **Yellow "Processing..."**: Pipeline is running
- **Blue "Awaiting BPMN Approval"**: Stage 1 feedback
- **Blue "Awaiting Mapping Approval"**: Stage 2 feedback
- **Green "Completed"**: Ready to apply

### Feedback Interface

#### BPMN Feedback Stage

```
┌─────────────────────────────────────────────────────┐
│ 🤖 I've generated a BPMN structure. Please review. │
│                                                     │
│ **BPMN Structure Generated:**                       │
│ - Nodes: 6                                          │
│ - Flows: 5                                          │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Optional: Provide feedback if rejecting... │   │
│ │                                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│  [✓ Approve BPMN]  [✗ Reject BPMN]               │
└─────────────────────────────────────────────────────┘
```

#### Mapping Feedback Stage

```
┌─────────────────────────────────────────────────────┐
│ 🤖 I've mapped activities to the BPMN nodes.       │
│                                                     │
│ **Activity Mapping Generated:**                     │
│ - Total mappings: 4                                 │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Optional: Provide feedback if rejecting... │   │
│ │                                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│  [✓ Approve Mapping]  [✗ Reject Mapping]         │
└─────────────────────────────────────────────────────┘
```

#### Completed Stage

```
┌─────────────────────────────────────────────────────┐
│ ✅ Pipeline completed successfully!                 │
│                                                     │
│ **Generated:**                                      │
│ - XML: ✅                                           │
│ - Activities: 4                                     │
│ - Ready to apply!                                   │
│                                                     │
│          [→ Apply to Canvas]                        │
└─────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables

Make sure your `.env.development` has:

```env
NEXT_PUBLIC_DEV_API=http://localhost:8000
```

### Backend API Base URL

The chatbot uses the API base from `src/apis/config.ts` which automatically adds Bearer token authentication.

## 💻 Code Examples

### Using the Chatbot Component

```tsx
import { AIChatbot } from "@/components/Bpmn/AIChatbot";

<AIChatbot
  isOpen={isChatbotOpen}
  onClose={() => setIsChatbotOpen(false)}
  processId={processID}
  onApplyBpmn={handleApplyBpmn}
/>;
```

### Handling Apply BPMN

```tsx
const handleApplyBpmn = async (bpmnJson: any) => {
  try {
    const result = convertJsonToProcess(bpmnJson);

    if (result.success && result.xml) {
      await bpmnReactJs.bpmnModeler.importXML(result.xml);

      const updatedProcess = {
        ...currentProcess,
        xml: result.xml,
        activities: result.activities || [],
      };

      updateLocalStorage(updatedProcess);
      dispatch(isSavedChange(false));

      toast({
        title: "BPMN Applied Successfully",
        status: "success",
      });
    }
  } catch (error) {
    toast({
      title: "Failed to apply BPMN",
      description: error?.message,
      status: "error",
    });
  }
};
```

### Testing with Mock Data

```typescript
import {
  mockPipelineStartResponse,
  mockMappingFeedbackResponse,
  mockPipelineCompletedResponse,
} from "./mock-data-pipeline-b";

// Simulate pipeline stages in development
handlePipelineResponse(mockPipelineStartResponse);
// User approves BPMN...
handlePipelineResponse(mockMappingFeedbackResponse);
// User approves mapping...
handlePipelineResponse(mockPipelineCompletedResponse);
```

## 🐛 Error Handling

### Network Errors

```typescript
try {
  await chatbotApi.startPipeline(text);
} catch (error) {
  toast({
    title: "Failed to start pipeline",
    description: error?.message || "Network error",
    status: "error",
  });
}
```

### Pipeline Errors

```json
{
  "thread_id": "xxx",
  "status": "error",
  "error": "Failed to generate BPMN: Invalid syntax"
}
```

### Validation Errors

- Invalid thread_id: 404 error
- Missing feedback: Returns current status
- Malformed request: 400 error

## 📝 API Response Types

### Pipeline Response

```typescript
interface PipelineResponse {
  thread_id: string;
  status: "waiting_feedback" | "running" | "completed" | "error";
  interrupt?: InterruptData;
  state?: any;
  current_node?: string;
  render_xml?: string;
  render_activities?: any[];
  error?: string;
}
```

### BPMN Feedback Interrupt

```typescript
interface BpmnFeedbackInterrupt {
  type: "bpmn_feedback";
  instruction: string;
  bpmn: {
    nodes: Array<{
      id: string;
      type: string;
      name: string;
    }>;
    flows: Array<{
      source: string;
      target: string;
      type: "SequenceFlow";
      condition: string | null;
    }>;
  };
  draft_snapshot?: any;
}
```

### Mapping Feedback Interrupt

```typescript
interface MappingFeedbackInterrupt {
  type: "mapping_feedback";
  instruction: string;
  mapping: Array<{
    node_id: string;
    activity_id: string;
    confidence: number;
    manual_review: boolean;
    type: string;
    candidates: Array<{
      activity_id: string;
      score: number;
    }>;
    input_bindings: Record<string, any>;
    outputs: string[];
  }>;
  bpmn?: any;
}
```

## 🚀 Usage Example

### Complete Flow

1. **User opens chatbot**

   ```typescript
   setIsChatbotOpen(true);
   ```

2. **User enters description**

   ```
   "Send email to finance, attach quotation, wait for reply, update SAP"
   ```

3. **Pipeline starts**

   - POST /pipeline/b/start
   - Returns thread_id and BPMN feedback

4. **User reviews BPMN**

   - Sees: "6 nodes, 5 flows"
   - Clicks "Approve BPMN"

5. **Submit BPMN approval**

   - POST /pipeline/b/feedback/{thread_id}
   - Body: { user_decision: "approve" }
   - Returns mapping feedback

6. **User reviews mapping**

   - Sees: "4 activity mappings"
   - Clicks "Approve Mapping"

7. **Submit mapping approval**

   - POST /pipeline/b/feedback/{thread_id}
   - Body: { user_mapping_decision: "approve" }
   - Returns completed status with XML

8. **User applies to canvas**

   - Clicks "Apply to Canvas"
   - XML imported to modeler
   - Activities saved to localStorage
   - Process marked as unsaved

9. **User saves process**
   - Clicks "Save All" in modeler
   - Data persisted to backend

## 🧪 Testing

### Mock Data Files

- **`mock-data-pipeline-b.ts`**: Contains all mock responses for testing
  - `mockPipelineStartResponse`: Initial BPMN feedback
  - `mockMappingFeedbackResponse`: Mapping feedback
  - `mockPipelineCompletedResponse`: Final result with XML
  - `mockBpmnRejectedResponse`: Rejected BPMN example
  - `mockMappingRejectedResponse`: Rejected mapping example

### Testing Workflow

```typescript
// 1. Test start pipeline
const startResponse = await chatbotApi.startPipeline(
  "Create a customer onboarding process"
);
expect(startResponse.status).toBe("waiting_feedback");
expect(startResponse.interrupt?.type).toBe("bpmn_feedback");

// 2. Test BPMN approval
const mappingResponse = await chatbotApi.submitFeedback(
  startResponse.thread_id,
  { user_decision: "approve" }
);
expect(mappingResponse.status).toBe("waiting_feedback");
expect(mappingResponse.interrupt?.type).toBe("mapping_feedback");

// 3. Test mapping approval
const completedResponse = await chatbotApi.submitFeedback(
  startResponse.thread_id,
  { user_mapping_decision: "approve" }
);
expect(completedResponse.status).toBe("completed");
expect(completedResponse.render_xml).toBeDefined();
```

## 🔍 Debugging

### Console Logs

The chatbot includes detailed console logging:

```javascript
console.log("📦 [Pipeline] Started:", data);
console.log("✅ [Pipeline] Feedback submitted:", data);
console.log("❌ [AI Chatbot] Error applying BPMN:", error);
```

### Check Pipeline Status

```typescript
const status = await chatbotApi.getPipelineStatus(threadId);
console.log("Current status:", status);
```

### Check Pending Feedback

```typescript
const feedback = await chatbotApi.getPendingFeedback(threadId);
console.log("Pending feedback:", feedback);
```

## 📚 Additional Resources

- **Backend API Docs**: See FastAPI endpoints documentation
- **BPMN Converter**: `src/utils/bpmn-parser/json-to-bpmn-xml.util.ts`
- **Mock Data**: `src/components/Bpmn/AIChatbot/mock-data-pipeline-b.ts`
- **Component Docs**: `src/components/Bpmn/AIChatbot/README.md`

## ✅ Completion Checklist

- [x] chatbotApi.ts updated with Scenario B endpoints
- [x] AIChatbot component supports two-stage feedback
- [x] UI shows stage-specific buttons (Approve/Reject BPMN, Approve/Reject Mapping)
- [x] Feedback textarea for rejection messages
- [x] Status badges reflect current pipeline stage
- [x] Apply to Canvas button on completion
- [x] Mock data for testing all stages
- [x] Error handling and toast notifications
- [x] Console logging for debugging
- [x] No lint errors
- [x] Documentation complete

## 🎉 Ready for Backend Integration!

The chatbot is now fully configured to work with the Scenario B Pipeline FastAPI backend. Simply ensure the backend is running at the configured URL and start testing!

**Test URL**: `http://localhost:8000/pipeline/b/start`
