# Comments API Documentation

## Overview
This document describes the Comments API for the BPMN Modeler. The API allows users to add, retrieve, update, and delete comments associated with BPMN process diagrams.

## Base URL
```
/api/processes/{processID}/comments
```

## Data Models

### Comment Object
```typescript
interface Comment {
  id: string;                    // Unique comment identifier
  author: {
    name: string;                // Author's display name
    avatar?: string;             // Optional avatar URL
  };
  content: string;               // Comment text content
  timestamp: string;             // ISO 8601 datetime string
  processID: string;             // Associated process ID
  elementID?: string;            // Optional: specific BPMN element reference
  parentCommentID?: string;      // Optional: for threaded replies
}
```

## API Endpoints

### 1. Get All Comments for a Process

**Endpoint:** `GET /api/processes/{processID}/comments`

**Description:** Retrieve all comments for a specific process.

**Parameters:**
- `processID` (path parameter) - The unique identifier of the process

**Query Parameters:**
- `elementID` (optional) - Filter comments by specific BPMN element
- `limit` (optional) - Maximum number of comments to return (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-123",
      "author": {
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "content": "This task needs review",
      "timestamp": "2025-11-04T14:48:00.000Z",
      "processID": "process-456",
      "elementID": "Task_1"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0
  }
}
```

**Error Responses:**
- `404 Not Found` - Process does not exist
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - User does not have permission to view comments

---

### 2. Add a New Comment

**Endpoint:** `POST /api/processes/{processID}/comments`

**Description:** Create a new comment for a process.

**Parameters:**
- `processID` (path parameter) - The unique identifier of the process

**Request Body:**
```json
{
  "content": "This is a new comment",
  "elementID": "Task_1"  // Optional
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "comment-789",
    "author": {
      "name": "Current User",
      "avatar": "https://example.com/user-avatar.jpg"
    },
    "content": "This is a new comment",
    "timestamp": "2025-12-02T10:30:00.000Z",
    "processID": "process-456",
    "elementID": "Task_1"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Process does not exist
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - User does not have permission to add comments

---

### 3. Update a Comment

**Endpoint:** `PUT /api/processes/{processID}/comments/{commentID}`

**Description:** Update an existing comment.

**Parameters:**
- `processID` (path parameter) - The unique identifier of the process
- `commentID` (path parameter) - The unique identifier of the comment

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "comment-789",
    "author": {
      "name": "Current User",
      "avatar": "https://example.com/user-avatar.jpg"
    },
    "content": "Updated comment content",
    "timestamp": "2025-12-02T10:30:00.000Z",
    "processID": "process-456",
    "elementID": "Task_1"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Comment or process does not exist
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - User does not have permission to update this comment

---

### 4. Delete a Comment

**Endpoint:** `DELETE /api/processes/{processID}/comments/{commentID}`

**Description:** Delete a comment.

**Parameters:**
- `processID` (path parameter) - The unique identifier of the process
- `commentID` (path parameter) - The unique identifier of the comment

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Comment or process does not exist
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - User does not have permission to delete this comment

---

### 5. Reply to a Comment (Threaded Comments)

**Endpoint:** `POST /api/processes/{processID}/comments/{commentID}/replies`

**Description:** Add a reply to an existing comment.

**Parameters:**
- `processID` (path parameter) - The unique identifier of the process
- `commentID` (path parameter) - The parent comment ID

**Request Body:**
```json
{
  "content": "This is a reply to the comment"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "comment-890",
    "author": {
      "name": "Another User",
      "avatar": "https://example.com/another-avatar.jpg"
    },
    "content": "This is a reply to the comment",
    "timestamp": "2025-12-02T11:00:00.000Z",
    "processID": "process-456",
    "parentCommentID": "comment-789"
  }
}
```

---

## Authentication

All API endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- Rate limit: 100 requests per minute per user
- Exceeding rate limit returns `429 Too Many Requests`

## Websocket Support (Future Enhancement)

For real-time comment updates, consider implementing WebSocket support:

**WebSocket Endpoint:** `ws://api.example.com/ws/processes/{processID}/comments`

**Events:**
- `comment.created` - New comment added
- `comment.updated` - Comment modified
- `comment.deleted` - Comment removed

## Implementation Notes

### Current Implementation (Mock)
The current implementation in `/src/apis/commentsApi.ts` is a mock that:
- Stores comments in-memory
- Simulates API delays
- Provides hardcoded sample comments

### Production Implementation Checklist
When implementing the real API:

1. **Backend Requirements:**
   - Database schema for comments table
   - User authentication and authorization
   - Process ownership validation
   - Soft delete for comment history

2. **Security Considerations:**
   - Validate user permissions for each operation
   - Sanitize comment content to prevent XSS
   - Implement rate limiting
   - Audit logging for comment operations

3. **Performance Optimization:**
   - Pagination for large comment lists
   - Caching strategy for frequently accessed comments
   - Database indexing on processID and timestamp

4. **Additional Features:**
   - Markdown support in comments
   - @mentions for notifying other users
   - File attachments
   - Emoji reactions
   - Comment search functionality

## Error Codes Summary

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Example Usage

### JavaScript/TypeScript Example

```typescript
import { getCommentsForProcess, addCommentToProcess } from '@/apis/commentsApi';

// Load comments
const comments = await getCommentsForProcess('process-123');

// Add a comment
const newComment = await addCommentToProcess('process-123', 'Great workflow!');

// Update a comment
const updated = await updateComment('process-123', 'comment-456', 'Updated text');

// Delete a comment
await deleteComment('process-123', 'comment-456');
```

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-02 | Initial API documentation |

---

**Note:** This is a living document and will be updated as the API evolves.

