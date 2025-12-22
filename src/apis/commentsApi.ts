/**
 * Comments API
 * 
 * This is a mock implementation for the Comments feature.
 * Replace with actual API calls when backend is ready.
 */

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
}

// Mock data storage (in-memory)
const mockCommentsStore: Record<string, Comment[]> = {};

/**
 * Get all comments for a specific process
 * @param processID - The ID of the process
 * @returns Promise<Comment[]> - Array of comments
 */
export const getCommentsForProcess = async (
  processID: string
): Promise<Comment[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock data
  if (!mockCommentsStore[processID]) {
    // Initialize with some sample comments
    mockCommentsStore[processID] = [
      {
        id: '1',
        author: {
          name: 'Minh Chien',
          avatar: undefined,
        },
        content: 'Autosaved before Copilot (AI generation)',
        timestamp: new Date('2025-11-04T14:48:00').toISOString(),
      },
      {
        id: '2',
        author: {
          name: 'System',
          avatar: undefined,
        },
        content: 'Autosaved before Copilot (AI generation)',
        timestamp: new Date('2025-11-05T14:48:00').toISOString(),
      },
      {
        id: '3',
        author: {
          name: 'Me',
          avatar: undefined,
        },
        content: 'I want to change email service',
        timestamp: new Date('2025-11-05T14:48:00').toISOString(),
      },
    ];
  }

  return mockCommentsStore[processID];
};

/**
 * Add a new comment to a process
 * @param processID - The ID of the process
 * @param content - The comment content
 * @returns Promise<Comment> - The newly created comment
 */
export const addCommentToProcess = async (
  processID: string,
  content: string
): Promise<Comment> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const newComment: Comment = {
    id: Date.now().toString(),
    author: {
      name: 'Current User',
      avatar: undefined,
    },
    content,
    timestamp: new Date().toISOString(),
  };

  if (!mockCommentsStore[processID]) {
    mockCommentsStore[processID] = [];
  }

  mockCommentsStore[processID].push(newComment);

  return newComment;
};

/**
 * Delete a comment
 * @param processID - The ID of the process
 * @param commentID - The ID of the comment to delete
 * @returns Promise<void>
 */
export const deleteComment = async (
  processID: string,
  commentID: string
): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (mockCommentsStore[processID]) {
    mockCommentsStore[processID] = mockCommentsStore[processID].filter(
      (comment) => comment.id !== commentID
    );
  }
};

/**
 * Update a comment
 * @param processID - The ID of the process
 * @param commentID - The ID of the comment to update
 * @param newContent - The new content
 * @returns Promise<Comment> - The updated comment
 */
export const updateComment = async (
  processID: string,
  commentID: string,
  newContent: string
): Promise<Comment> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!mockCommentsStore[processID]) {
    throw new Error('Process not found');
  }

  const commentIndex = mockCommentsStore[processID].findIndex(
    (c) => c.id === commentID
  );

  if (commentIndex === -1) {
    throw new Error('Comment not found');
  }

  mockCommentsStore[processID][commentIndex].content = newContent;

  return mockCommentsStore[processID][commentIndex];
};

