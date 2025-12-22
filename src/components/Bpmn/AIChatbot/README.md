# AI Chatbot for BPMN Generation

## Overview

The AI Chatbot component allows users to generate BPMN processes through natural language conversation. It integrates with the backend AI service to generate BPMN JSON, which is then converted to BPMN XML and applied to the canvas.

## Features

- 💬 **Natural Language Processing**: Describe your process in plain language
- 🤖 **AI-Powered Generation**: Automatically generates BPMN diagrams from descriptions
- ✅ **Confirmation Flow**: Review and confirm before applying to canvas
- 🔄 **Regeneration**: Request different approaches if needed
- 📦 **Activity Mapping**: Automatically assigns activities from the AI response

## Components

### 1. `AIChatbot.tsx`

Main chat interface component with:

- Message display area
- Input field for user messages
- Confirmation buttons for applying BPMN
- Loading states and error handling

### 2. `AIChatbotButton.tsx`

Floating action button that triggers the chatbot:

- Positioned next to zoom controls
- Visual feedback when active
- Tooltip for user guidance

### 3. `chatbotApi.ts`

API service for chatbot interactions:

- `sendMessage`: Send user message and receive AI response
- `getConversation`: Retrieve conversation history
- `createNewConversation`: Start new conversation
- `deleteConversation`: Clear conversation

## Usage

### In CustomModeler

```tsx
import { convertJsonToProcess } from "@/utils/bpmn-parser/json-to-bpmn-xml.util";

const handleApplyBpmn = async (bpmnJson: any) => {
  // Convert JSON to BPMN XML and activities
  const result = convertJsonToProcess(bpmnJson);

  if (result.success && result.xml) {
    // Import to modeler
    await bpmnReactJs.bpmnModeler.importXML(result.xml);

    // Save to localStorage
    const updatedProcess = {
      ...currentProcess,
      xml: result.xml,
      activities: result.activities || [],
    };
    updateLocalStorage(updatedProcess);
  }
};

<BpmnModelerLayout
  isChatbotOpen={isChatbotOpen}
  onToggleChatbot={handleToggleChatbot}
  onApplyBpmn={handleApplyBpmn}
  // ... other props
/>;
```

## Backend API Contract

### Request: `POST /api/chatbot/message`

```json
{
  "message": "Create a purchase approval process",
  "conversationId": "optional-conversation-id",
  "processId": "process-id"
}
```

### Response:

```json
{
  "conversationId": "conv-123",
  "message": "I've generated a purchase approval process...",
  "bpmnJson": {
    "bpmn": {
      "nodes": [
        {
          "id": "StartEvent_1",
          "type": "StartEvent",
          "name": "Start",
          "mapping": {
            "is_automatic": true,
            "bot_id": "bot-123",
            "manual_review": false
          }
        },
        {
          "id": "Task_1",
          "type": "Task",
          "name": "Review Request",
          "mapping": { ... }
        },
        {
          "id": "EndEvent_1",
          "type": "EndEvent",
          "name": "End"
        }
      ],
      "flows": [
        {
          "source": "StartEvent_1",
          "target": "Task_1",
          "type": "SequenceFlow",
          "condition": null
        },
        {
          "source": "Task_1",
          "target": "EndEvent_1",
          "type": "SequenceFlow",
          "condition": null
        }
      ]
    },
    "mapping": [
      {
        "node_id": "Task_1",
        "activity_id": "package.activity_name",
        "confidence": 0.95,
        "manual_review": false,
        "type": "Task",
        "candidates": [...],
        "input_bindings": {...},
        "outputs": [...]
      }
    ]
  }
}
```

## BPMN JSON Structure

The backend should return a BPMN JSON following this structure:

```typescript
interface BpmnJsonData {
  bpmn: {
    nodes: BpmnNodeJson[];
    flows: BpmnFlowJson[];
  };
  mapping?: ActivityMapping[]; // Optional activity mappings
}

interface BpmnNodeJson {
  id: string; // Unique identifier
  type: BpmnNodeType; // StartEvent, Task, EndEvent, etc.
  name: string; // Display name
  mapping?: BpmnNodeMapping; // Optional AI mapping
}

interface BpmnFlowJson {
  source: string; // Source node ID
  target: string; // Target node ID
  type: "SequenceFlow";
  condition: string | null; // Optional condition expression
}
```

### Supported Node Types

- `StartEvent`, `EndEvent`
- `Task`, `UserTask`, `ServiceTask`, `ManualTask`
- `SendTask`, `ReceiveTask`, `ScriptTask`, `BusinessRuleTask`
- `ExclusiveGateway`, `ParallelGateway`, `InclusiveGateway`
- `SubProcess`

## Example Conversation Flow

1. **User**: "Create a purchase approval process"
2. **AI**: "I'll create a process with the following steps..."
3. **System**: "BPMN process generated successfully! Would you like to apply it?"
4. **User**: Clicks "Apply to Canvas" or "Regenerate"
5. **System**: Converts JSON to XML and applies to canvas

## Error Handling

The chatbot handles several error scenarios:

- **API Errors**: Network or server errors
- **Conversion Errors**: Invalid BPMN JSON format
- **Import Errors**: Failed to import XML to modeler
- **Storage Errors**: Failed to save to localStorage

All errors are displayed with user-friendly messages and logged to console.

## Styling

The chatbot uses Chakra UI components with custom styling:

- **Color Scheme**: Teal (matches RPA theme)
- **Position**: Fixed top-right corner
- **Size**: 500px × 700px
- **Z-Index**: 1000 (ensures it's on top)

## Future Enhancements

- [ ] Streaming responses (like ChatGPT)
- [ ] Conversation history persistence
- [ ] Multi-language support
- [ ] BPMN validation before applying
- [ ] Activity package suggestions
- [ ] Variable extraction from process description
- [ ] Export conversation as documentation
