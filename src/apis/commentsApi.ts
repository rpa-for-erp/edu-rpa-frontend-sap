/**
 * Comments API
 *
 * REST API calls for process comments.
 * Used for initial data loading - real-time updates come via WebSocket.
 */

import {
  Comment,
  CommentResponse,
  CommentApiResponse,
  CreateCommentDto,
  UpdateCommentDto,
} from '@/interfaces/comment';
import apiBase from './config';

const API_BASE = process.env.NEXT_PUBLIC_DEV_API;

/**
 * Transform API response to normalized Comment format
 */
const transformComment = (response: CommentResponse): Comment => ({
  id: response.id,
  content: response.commentText,
  processId: response.process_id,
  processVersionId: response.process_version_id,
  elementId: response.node_id,
  createdBy: {
    id: String(response.user.id),
    name: response.user.name,
    email: response.user.email,
    avatar: response.user.avatarUrl || undefined,
  },
  createdAt: response.createdAt,
});

/**
 * Get all comments for a specific process
 * @param processId - The ID of the process
 * @param elementId - Optional: filter by specific element (node_id)
 * @returns Promise<Comment[]> - Array of comments
 */
export const getCommentsForProcess = async (
  processId: string,
  elementId?: string
): Promise<Comment[]> => {
  const params = new URLSearchParams();
  if (elementId) {
    params.append('nodeId', elementId);
  }

  const queryString = params.toString();
  const url = `${API_BASE}/processes/${processId}/comments${queryString ? `?${queryString}` : ''}`;

  const response = await apiBase.get<CommentApiResponse<CommentResponse[]>>(url);
  const data = response.data.data || [];
  
  return data.map(transformComment);
};

/**
 * Add a new comment to a process
 * @param processId - The ID of the process
 * @param content - The comment content
 * @param elementId - Optional: ID of the BPMN element (node_id)
 * @returns Promise<Comment> - The newly created comment
 */
export const addCommentToProcess = async (
  processId: string,
  content: string,
  elementId?: string
): Promise<Comment> => {
  const payload: CreateCommentDto = {
    commentText: content,
    nodeId: elementId,
  };

  const response = await apiBase.post<CommentApiResponse<CommentResponse>>(
    `${API_BASE}/processes/${processId}/comments`,
    payload
  );

  return transformComment(response.data.data);
};

/**
 * Update a comment
 * @param processId - The ID of the process
 * @param commentId - The ID of the comment to update
 * @param content - The new content
 * @returns Promise<Comment> - The updated comment
 */
export const updateComment = async (
  processId: string,
  commentId: string,
  content: string
): Promise<Comment> => {
  const payload: UpdateCommentDto = { commentText: content };

  const response = await apiBase.put<CommentApiResponse<CommentResponse>>(
    `${API_BASE}/processes/${processId}/comments/${commentId}`,
    payload
  );

  return transformComment(response.data.data);
};

/**
 * Delete a comment
 * @param processId - The ID of the process
 * @param commentId - The ID of the comment to delete
 * @returns Promise<void>
 */
export const deleteComment = async (
  processId: string,
  commentId: string
): Promise<void> => {
  await apiBase.delete(`${API_BASE}/processes/${processId}/comments/${commentId}`);
};

/**
 * Get comments for a specific element
 * @param processId - The ID of the process
 * @param elementId - The ID of the BPMN element (node_id)
 * @returns Promise<Comment[]> - Array of comments for the element
 */
export const getCommentsForElement = async (
  processId: string,
  elementId: string
): Promise<Comment[]> => {
  return getCommentsForProcess(processId, elementId);
};

const commentsApi = {
  getCommentsForProcess,
  addCommentToProcess,
  updateComment,
  deleteComment,
  getCommentsForElement,
};

export default commentsApi;
