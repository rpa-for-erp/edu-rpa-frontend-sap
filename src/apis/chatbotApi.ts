import apiBase from "./config";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

// ============================================================================
// Scenario B Pipeline API Types
// ============================================================================

export interface PipelineStartRequest {
  text: string;
  options?: Record<string, any>;
}

export interface BpmnFeedbackInterrupt {
  type: "bpmn_feedback";
  instruction: string;
  bpmn: any; // BPMN structure
  draft_snapshot?: any;
}

export interface MappingFeedbackInterrupt {
  type: "mapping_feedback";
  instruction: string;
  mapping: any; // Activity mapping data
  bpmn?: any;
}

export type InterruptData = BpmnFeedbackInterrupt | MappingFeedbackInterrupt;

export interface PipelineResponse {
  thread_id: string;
  status: "waiting_feedback" | "running" | "completed" | "error";
  interrupt?: InterruptData;
  /**
   * Arbitrary pipeline state (legacy / internal usage)
   */
  state?: any;
  current_node?: string;
  /**
   * Legacy render fields – kept for backward compatibility
   */
  render_xml?: string;
  render_activities?: any[];
  /**
   * New top-level fields returned by backend on completion
   * {
   *   thread_id,
   *   status: "completed",
   *   state,
   *   mapping,
   *   bpmn
   * }
   */
  mapping?: any;
  bpmn?: any;
  error?: string;
}

export interface BpmnFeedbackRequest {
  user_decision: "approve" | "reject";
  user_feedback_text?: string;
}

export interface MappingFeedbackRequest {
  user_mapping_decision: "approve" | "reject";
  user_mapping_feedback_text?: string;
}

export type FeedbackRequest = BpmnFeedbackRequest | MappingFeedbackRequest;

// ============================================================================
// Legacy Types (keeping for backward compatibility)
// ============================================================================

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
  processId?: string;
}

export interface SendMessageResponse {
  conversationId: string;
  message: string;
  bpmnJson?: any;
  requiresConfirmation?: boolean;
  confirmationType?: "apply_bpmn" | "regenerate" | "continue";
}

export interface ChatbotConversation {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Scenario B Pipeline API Functions
// ============================================================================

/**
 * Start a new pipeline execution
 * Returns thread_id and first interrupt (BPMN feedback)
 */
const startPipeline = async (
  text: string,
  options?: Record<string, any>
): Promise<PipelineResponse> => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_CHATBOT_API}/pipeline/b/start`, {
      text,
      options: options || {},
    })
    .then((res: any) => {
      return res.data;
    });
};

/**
 * Get pending feedback for a thread
 */
const getPendingFeedback = async (
  threadId: string
): Promise<PipelineResponse> => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_CHATBOT_API}/pipeline/b/feedback/${threadId}`
    )
    .then((res: any) => {
      return res.data;
    });
};

/**
 * Submit user feedback (BPMN or Mapping)
 */
const submitFeedback = async (
  threadId: string,
  feedback: FeedbackRequest
): Promise<PipelineResponse> => {
  return await apiBase
    .post(
      `${process.env.NEXT_PUBLIC_CHATBOT_API}/pipeline/b/feedback/${threadId}`,
      feedback
    )
    .then((res: any) => {
      return res.data;
    });
};

/**
 * Get pipeline status
 */
const getPipelineStatus = async (
  threadId: string
): Promise<PipelineResponse> => {
  return await apiBase
    .get(`${process.env.NEXT_PUBLIC_CHATBOT_API}/pipeline/b/status/${threadId}`)
    .then((res: any) => {
      return res.data;
    });
};

// ============================================================================
// Legacy API Functions (keeping for backward compatibility)
// ============================================================================

const sendMessage = async (
  payload: SendMessageRequest
): Promise<SendMessageResponse> => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_CHATBOT_API}/chatbot/message`, payload)
    .then((res: any) => {
      return res.data;
    });
};

const getConversation = async (
  conversationId: string
): Promise<ChatbotConversation> => {
  return await apiBase
    .get(
      `${process.env.NEXT_PUBLIC_CHATBOT_API}/chatbot/conversations/${conversationId}`
    )
    .then((res: any) => {
      return res.data;
    });
};

const createNewConversation = async (
  processId?: string
): Promise<ChatbotConversation> => {
  return await apiBase
    .post(`${process.env.NEXT_PUBLIC_CHATBOT_API}/chatbot/conversations`, {
      processId,
    })
    .then((res: any) => {
      return res.data;
    });
};

const deleteConversation = async (conversationId: string): Promise<void> => {
  return await apiBase
    .delete(
      `${process.env.NEXT_PUBLIC_CHATBOT_API}/chatbot/conversations/${conversationId}`
    )
    .then((res: any) => {
      return res.data;
    });
};

const chatbotApi = {
  // Scenario B Pipeline APIs
  startPipeline,
  getPendingFeedback,
  submitFeedback,
  getPipelineStatus,
  // Legacy APIs
  sendMessage,
  getConversation,
  createNewConversation,
  deleteConversation,
};

export default chatbotApi;
