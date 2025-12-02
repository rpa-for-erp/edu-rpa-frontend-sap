# Studio Process API Metadata Structure

## Overview

This document defines the complete API structure for the Studio Process management system. Use this as a reference for backend development.

---

## 1. Get All Processes

### Endpoint

```
GET /api/processes
```

### Query Parameters

| Parameter | Type   | Required | Default   | Description                                  |
| --------- | ------ | -------- | --------- | -------------------------------------------- |
| limit     | number | No       | 12        | Number of items per page (12, 24, or 48)     |
| page      | number | No       | 1         | Page number for pagination                   |
| search    | string | No       | -         | Search by process name                       |
| status    | string | No       | all       | Filter by status: 'all', 'draft', 'deployed' |
| owner     | string | No       | all       | Filter by owner: 'all', 'me', or user ID     |
| sortBy    | string | No       | updatedAt | Sort field: 'updatedAt', 'name', 'version'   |
| sortOrder | string | No       | desc      | Sort order: 'asc' or 'desc'                  |

### Response Structure

```typescript
{
  success: boolean;
  data: {
    processes: ProcessItem[];
    pagination: {
      total: number;           // Total number of processes
      page: number;            // Current page
      limit: number;           // Items per page
      totalPages: number;      // Total number of pages
    };
  };
  message?: string;
}
```

### ProcessItem Structure

```typescript
interface ProcessItem {
  id: string; // Unique process ID (UUID)
  name: string; // Process name
  description: string; // Process description
  status: "draft" | "deployed"; // Process status
  version: number; // Process version number
  xml: string; // BPMN XML content
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  ownerId: string; // Owner user ID
  sharedByUser: {
    // Null if owner is current user
    id: string;
    name: string;
    email: string;
  } | null;
  isPinned: boolean; // Whether process is pinned
  activities: Activity[]; // Process activities
  variables: Variable[]; // Process variables
  metadata: {
    executionCount: number; // Number of times executed
    lastExecutedAt: string | null; // Last execution timestamp
    tags: string[]; // Process tags
  };
}
```

### Activity Structure

```typescript
interface Activity {
  id: string;
  name: string;
  type: string; // Activity type (e.g., 'task', 'gateway', etc.)
  properties: Record<string, any>;
}
```

### Variable Structure

```typescript
interface Variable {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  defaultValue: any;
  description?: string;
}
```

### Example Response

```json
{
  "success": true,
  "data": {
    "processes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Table Data Extraction for Sales Opportunitie",
        "description": "Take data from rpasamples opportunities, write it",
        "status": "draft",
        "version": 10,
        "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
        "createdAt": "2024-11-15T08:30:00.000Z",
        "updatedAt": "2024-12-01T10:43:00.000Z",
        "ownerId": "user-123",
        "sharedByUser": null,
        "isPinned": false,
        "activities": [],
        "variables": [],
        "metadata": {
          "executionCount": 15,
          "lastExecutedAt": "2024-11-30T14:20:00.000Z",
          "tags": ["sales", "data-extraction"]
        }
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 12,
      "totalPages": 4
    }
  }
}
```

---

## 2. Get Process Count

### Endpoint

```
GET /api/processes/count
```

### Query Parameters

Same filters as Get All Processes (search, status, owner)

### Response Structure

```typescript
{
  success: boolean;
  data: {
    count: number;
  };
  message?: string;
}
```

### Example Response

```json
{
  "success": true,
  "data": {
    "count": 42
  }
}
```

---

## 3. Get Process By ID

### Endpoint

```
GET /api/processes/:id
```

### Path Parameters

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| id        | string | Yes      | Process ID (UUID) |

### Response Structure

```typescript
{
  success: boolean;
  data: ProcessItem;
  message?: string;
}
```

---

## 4. Create Process

### Endpoint

```
POST /api/processes
```

### Request Body

```typescript
{
  id?: string;                 // Optional: If not provided, backend generates UUID
  name: string;                // Required
  description: string;         // Required
  xml: string;                 // Required: Initial BPMN XML
  status?: 'draft' | 'deployed'; // Optional: Default 'draft'
  activities?: Activity[];     // Optional: Default []
  variables?: Variable[];      // Optional: Default []
  metadata?: {
    tags?: string[];
  };
}
```

### Response Structure

```typescript
{
  success: boolean;
  data: ProcessItem;
  message?: string;
}
```

### Example Request

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "New Sales Process",
  "description": "Process for handling sales opportunities",
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "status": "draft",
  "metadata": {
    "tags": ["sales", "automation"]
  }
}
```

---

## 5. Update Process

### Endpoint

```
PUT /api/processes/:id
```

### Path Parameters

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| id        | string | Yes      | Process ID (UUID) |

### Request Body

All fields optional, only include fields to update:

```typescript
{
  name?: string;
  description?: string;
  xml?: string;
  status?: 'draft' | 'deployed';
  version?: number;            // Auto-increment if not provided
  activities?: Activity[];
  variables?: Variable[];
  metadata?: {
    tags?: string[];
  };
}
```

### Response Structure

```typescript
{
  success: boolean;
  data: ProcessItem;
  message?: string;
}
```

---

## 6. Delete Process

### Endpoint

```
DELETE /api/processes/:id
```

### Path Parameters

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| id        | string | Yes      | Process ID (UUID) |

### Response Structure

```typescript
{
  success: boolean;
  data: {
    id: string;                // Deleted process ID
    deletedAt: string;         // Timestamp of deletion
  };
  message?: string;
}
```

---

## 7. Duplicate Process

### Endpoint

```
POST /api/processes/:id/duplicate
```

### Path Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| id        | string | Yes      | Source process ID to duplicate |

### Request Body

```typescript
{
  name: string;                // Required: New process name
  description?: string;        // Optional: If not provided, copies from original
}
```

### Response Structure

```typescript
{
  success: boolean;
  data: ProcessItem;           // Newly created duplicate process
  message?: string;
}
```

### Example Request

```json
{
  "name": "Copy of Sales Process",
  "description": "Duplicated from original sales process"
}
```

---

## 8. Share Process

### Endpoint

```
POST /api/processes/:id/share
```

### Path Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| id        | string | Yes      | Process ID to share |

### Request Body

```typescript
{
  email: string;               // Required: Email of user to share with
  permission: 'view' | 'edit'; // Required: Permission level
  message?: string;            // Optional: Message to include in share notification
}
```

### Response Structure

```typescript
{
  success: boolean;
  data: {
    processId: string;
    sharedWith: {
      userId: string;
      email: string;
      name: string;
      permission: 'view' | 'edit';
    };
    sharedAt: string;
  };
  message?: string;
}
```

### Example Request

```json
{
  "email": "colleague@example.com",
  "permission": "view",
  "message": "Please review this automation process"
}
```

---

## 9. Pin/Unpin Process

### Endpoint

```
PUT /api/processes/:id/pin
```

### Path Parameters

| Parameter | Type   | Required | Description             |
| --------- | ------ | -------- | ----------------------- |
| id        | string | Yes      | Process ID to pin/unpin |

### Request Body

```typescript
{
  isPinned: boolean; // Required: true to pin, false to unpin
}
```

### Response Structure

```typescript
{
  success: boolean;
  data: {
    processId: string;
    isPinned: boolean;
  };
  message?: string;
}
```

---

## 10. Update Process Status

### Endpoint

```
PUT /api/processes/:id/status
```

### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Process ID  |

### Request Body

```typescript
{
  status: "draft" | "deployed"; // Required: New status
}
```

### Response Structure

```typescript
{
  success: boolean;
  data: ProcessItem;
  message?: string;
}
```

---

## Error Responses

All endpoints should return consistent error responses:

### Structure

```typescript
{
  success: false;
  error: {
    code: string;              // Error code (e.g., 'PROCESS_NOT_FOUND')
    message: string;           // Human-readable error message
    details?: any;             // Optional additional error details
  };
  statusCode: number;          // HTTP status code
}
```

### Common Error Codes

| Code              | Status | Description                     |
| ----------------- | ------ | ------------------------------- |
| PROCESS_NOT_FOUND | 404    | Process with given ID not found |
| UNAUTHORIZED      | 401    | User not authenticated          |
| FORBIDDEN         | 403    | User doesn't have permission    |
| INVALID_INPUT     | 400    | Invalid request data            |
| DUPLICATE_NAME    | 409    | Process name already exists     |
| SERVER_ERROR      | 500    | Internal server error           |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "PROCESS_NOT_FOUND",
    "message": "Process with ID '550e8400-e29b-41d4-a716-446655440000' not found",
    "details": {
      "processId": "550e8400-e29b-41d4-a716-446655440000"
    }
  },
  "statusCode": 404
}
```

---

## Authentication

All endpoints require authentication. Include JWT token in request headers:

```
Authorization: Bearer <jwt_token>
```

---

## Rate Limiting

Recommended rate limits:

- GET requests: 100 per minute per user
- POST/PUT requests: 30 per minute per user
- DELETE requests: 10 per minute per user

---

## Notes for Backend Implementation

1. **Auto-increment Version**: When updating a process, automatically increment the version number unless explicitly provided
2. **Soft Delete**: Consider implementing soft delete for processes (mark as deleted instead of actual deletion)
3. **Timestamps**: Always use ISO 8601 format for timestamps
4. **Validation**: Validate BPMN XML format before saving
5. **Permissions**: Implement proper permission checks for shared processes
6. **Pagination**: Default to 12 items per page, support 12, 24, and 48
7. **Search**: Implement fuzzy search on process name and description
8. **Caching**: Consider caching process counts and list queries
9. **Audit Log**: Log all process modifications for audit trail
10. **File Size**: Set reasonable limits for XML file size (e.g., 5MB)

---

## Database Schema Recommendations

### processes table

```sql
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  xml TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  version INTEGER DEFAULT 0,
  owner_id UUID REFERENCES users(id),
  is_pinned BOOLEAN DEFAULT false,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);
```

### process_shares table

```sql
CREATE TABLE process_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id),
  shared_by_user_id UUID REFERENCES users(id),
  permission VARCHAR(20) NOT NULL,
  shared_at TIMESTAMP DEFAULT NOW()
);
```

### process_activities table

```sql
CREATE TABLE process_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### process_variables table

```sql
CREATE TABLE process_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  default_value JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### process_tags table

```sql
CREATE TABLE process_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Frontend Data Mapping

The frontend expects data in this exact structure:

```typescript
// Frontend expected format
{
  id: string;
  name: string;
  description: string;
  sharedBy: string; // Display name (from sharedByUser.name or 'me')
  last_modified: string; // Formatted date string
  last_modified_timestamp: number; // Unix timestamp for sorting
  version: number;
  status: "draft" | "deployed";
  pinned: boolean;
}
```

Make sure backend response includes all these fields or can be easily transformed.

---

## Testing Checklist

- [ ] Create process with valid data
- [ ] Create process with invalid XML
- [ ] Get all processes with pagination
- [ ] Get all processes with filters (status, owner)
- [ ] Get all processes with search
- [ ] Get all processes with sorting
- [ ] Update process name and description
- [ ] Update process XML and activities
- [ ] Delete process
- [ ] Duplicate process
- [ ] Share process with valid email
- [ ] Share process with invalid email
- [ ] Pin/unpin process
- [ ] Change process status
- [ ] Test unauthorized access
- [ ] Test rate limiting
- [ ] Test concurrent updates
- [ ] Test large XML files
- [ ] Test special characters in name/description

---

## Version History

- **v1.0** - Initial API specification (2024-12-01)

---

## Contact

For questions about this API specification, contact the frontend development team.
