# 🚀 Scenario B Pipeline - Quick Start Guide

## 📖 TL;DR

AI Chatbot with **2-stage feedback** for BPMN generation:

1. **BPMN Review** → Approve/Reject structure
2. **Mapping Review** → Approve/Reject activity assignments
3. **Apply** → Import to canvas

---

## 🔌 Backend Setup

**Endpoint**: `http://localhost:8000`

**Required APIs**:

- `POST /pipeline/b/start`
- `POST /pipeline/b/feedback/{thread_id}`
- `GET /pipeline/b/status/{thread_id}`
- `GET /pipeline/b/feedback/{thread_id}`

**Environment**:

```env
NEXT_PUBLIC_DEV_API=http://localhost:8000
```

---

## 🎯 User Flow

```
1. User: "Send email to finance..."
   ↓
2. AI: Shows BPMN (6 nodes, 5 flows)
   ↓
3. User: [Approve BPMN] or [Reject BPMN + feedback]
   ↓
4. AI: Shows Mapping (4 activities)
   ↓
5. User: [Approve Mapping] or [Reject Mapping + feedback]
   ↓
6. AI: "✅ Completed! Ready to apply"
   ↓
7. User: [Apply to Canvas]
   ↓
8. Canvas updated with BPMN
```

---

## 💻 Code Usage

### Import

```typescript
import { AIChatbot } from "@/components/Bpmn/AIChatbot";
import chatbotApi from "@/apis/chatbotApi";
```

### Component

```tsx
<AIChatbot
  isOpen={isChatbotOpen}
  onClose={() => setIsChatbotOpen(false)}
  processId={processID}
  onApplyBpmn={handleApplyBpmn}
/>
```

### API Calls

```typescript
// Start
const response = await chatbotApi.startPipeline("Your process description");

// Approve BPMN
await chatbotApi.submitFeedback(threadId, {
  user_decision: "approve",
});

// Reject BPMN with feedback
await chatbotApi.submitFeedback(threadId, {
  user_decision: "reject",
  user_feedback_text: "Add error handling",
});

// Approve Mapping
await chatbotApi.submitFeedback(threadId, {
  user_mapping_decision: "approve",
});

// Reject Mapping with feedback
await chatbotApi.submitFeedback(threadId, {
  user_mapping_decision: "reject",
  user_mapping_feedback_text: "Wrong activity for Task_1",
});
```

---

## 🧪 Testing with Mock Data

```typescript
import {
  mockPipelineStartResponse,
  mockMappingFeedbackResponse,
  mockPipelineCompletedResponse,
} from "./mock-data-pipeline-b";

// Simulate flow
handlePipelineResponse(mockPipelineStartResponse); // Stage 1
handlePipelineResponse(mockMappingFeedbackResponse); // Stage 2
handlePipelineResponse(mockPipelineCompletedResponse); // Done
```

---

## 🎨 UI States

| Stage              | Badge                   | Buttons                |
| ------------------ | ----------------------- | ---------------------- |
| `idle`             | Gray "Ready"            | Input enabled          |
| `processing`       | Yellow "Processing..."  | Input disabled         |
| `bpmn_feedback`    | Blue "Awaiting BPMN"    | Approve/Reject BPMN    |
| `mapping_feedback` | Blue "Awaiting Mapping" | Approve/Reject Mapping |
| `completed`        | Green "Completed"       | Apply to Canvas        |

---

## 🐛 Common Issues

### 1. CORS Error

**Problem**: `No 'Access-Control-Allow-Origin' header`
**Solution**: Configure backend CORS to allow frontend origin

### 2. 404 Not Found

**Problem**: Endpoint not found
**Solution**: Check `NEXT_PUBLIC_DEV_API` in `.env.development`

### 3. Network Error

**Problem**: Cannot connect to backend
**Solution**: Ensure backend is running at configured URL

### 4. Thread ID Not Found

**Problem**: `thread_id` expired or invalid
**Solution**: Start new pipeline (new thread_id)

---

## 📊 Response Examples

### Start Response

```json
{
  "thread_id": "abc-123",
  "status": "waiting_feedback",
  "interrupt": {
    "type": "bpmn_feedback",
    "instruction": "Review the BPMN...",
    "bpmn": { "nodes": [...], "flows": [...] }
  }
}
```

### Mapping Response

```json
{
  "thread_id": "abc-123",
  "status": "waiting_feedback",
  "interrupt": {
    "type": "mapping_feedback",
    "instruction": "Review the mapping...",
    "mapping": [
      {
        "node_id": "Task_1",
        "activity_id": "email.send",
        "confidence": 0.95,
        ...
      }
    ]
  }
}
```

### Completed Response

```json
{
  "thread_id": "abc-123",
  "status": "completed",
  "render_xml": "<?xml version='1.0'...",
  "render_activities": [
    {
      "activityID": "Task_1",
      "activityName": "Send Email",
      "keyword": "email.send",
      ...
    }
  ]
}
```

---

## 🔍 Debugging

### Console Logs

```javascript
// Look for these prefixes:
"📦 [Pipeline] Started:";
"✅ [Pipeline] Feedback submitted:";
"❌ [AI Chatbot] Error:";
```

### Check Status

```typescript
const status = await chatbotApi.getPipelineStatus(threadId);
console.log(status);
```

### Check Pending Feedback

```typescript
const pending = await chatbotApi.getPendingFeedback(threadId);
console.log(pending);
```

---

## 📝 Example Prompts

```
"Send email to finance, attach quotation, wait for reply, update SAP"
"Create customer onboarding: collect docs, verify identity, create account"
"Purchase order workflow: submit request, manager approval, create PO, notify supplier"
"Invoice approval: receive invoice, validate, get approval, update accounting"
"Leave request: employee submits, manager reviews, HR approves, update calendar"
```

---

## ✅ Quick Checklist

- [ ] Backend running at configured URL
- [ ] CORS configured
- [ ] `.env.development` has correct API URL
- [ ] Chatbot button visible next to zoom controls
- [ ] Can open chatbot dialog
- [ ] Can send message and start pipeline
- [ ] Can see BPMN feedback stage
- [ ] Can approve/reject BPMN
- [ ] Can see mapping feedback stage
- [ ] Can approve/reject mapping
- [ ] Can see completion message
- [ ] Can apply to canvas
- [ ] XML imported to modeler
- [ ] Process saved to localStorage

---

## 📚 Full Documentation

- **Complete Guide**: `SCENARIO_B_PIPELINE_INTEGRATION.md`
- **Summary**: `SCENARIO_B_SUMMARY.md`
- **Component README**: `README.md`
- **Mock Data**: `mock-data-pipeline-b.ts`

---

## 🆘 Need Help?

1. Check console logs with `[Pipeline]` prefix
2. Verify backend is running and accessible
3. Test with mock data first
4. Check network tab in browser DevTools
5. Verify CORS configuration

---

**Happy coding! 🎉**
