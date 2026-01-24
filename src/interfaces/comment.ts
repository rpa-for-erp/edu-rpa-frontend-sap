/**
 * Comment Interface Definitions
 *
 * These interfaces define the structure of comment-related data
 * for the BPMN process commenting feature with real-time WebSocket support.
 */

// User who created the comment (from API response)
export interface CommentUser {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  provider?: string;
}

// Comment entity from API (matches backend response)
export interface CommentResponse {
  id: string;
  commentText: string;
  createdAt: string; // ISO date string
  user_id: number;
  process_id: string;
  process_version_id: string;
  node_id: string; // elementId - the BPMN node this comment is attached to
  user: CommentUser;
}

// Normalized comment for frontend use
export interface Comment {
  id: string;
  content: string;
  processId: string;
  processVersionId?: string;
  elementId?: string; // node_id from API
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  createdAt: string; // ISO date string
  updatedAt?: string;
  isEdited?: boolean;
}

// API Response for comments list
export interface CommentsListResponse {
  comments: Comment[];
  total: number;
  page?: number;
  limit?: number;
}

// API Response wrapper (consistent with other APIs)
export interface CommentApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

// DTO for creating a new comment (matches backend API)
export interface CreateCommentDto {
  commentText: string;
  nodeId?: string;
}

// DTO for updating a comment (matches backend API)
export interface UpdateCommentDto {
  commentText: string;
}

// Socket.IO event payloads
export interface JoinCommentRoomPayload {
  processId: string;
}

export interface AddCommentPayload {
  processId: string;
  nodeId?: string; // elementId - matches backend naming
  commentText: string;
}

export interface CommentAddedEvent {
  comment: Comment;
}

export interface CommentUpdatedEvent {
  comment: Comment;
}

export interface CommentDeletedEvent {
  commentId: string;
  processId: string;
}

// Socket connection state
export interface CommentSocketState {
  isConnected: boolean;
  isJoined: boolean;
  error?: string;
}
