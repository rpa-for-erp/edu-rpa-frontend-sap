# Versions API Documentation

## Overview
API endpoints for managing BPMN process versions. Versioning allows users to track and review changes across all resources in a process application.

## Base URL
```
{BASE_URL}/processes/{processId}/versions
```

---

## Endpoints

### 1. Get All Versions
Retrieves all versions for a specific process.

**Endpoint:** `GET /processes/{processId}/versions`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Response:**
```json
{
  "versions": [
    {
      "id": "version-uuid-1",
      "tag": "v1.0.0",
      "description": "Initial release",
      "createdBy": {
        "id": "user-uuid",
        "name": "Minh Chien",
        "email": "chien@example.com",
        "avatar": "https://..."
      },
      "createdAt": "2025-11-04T14:48:00.000Z",
      "processId": "process-uuid",
      "isCurrent": false
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### 2. Get Single Version
Retrieves a specific version by ID.

**Endpoint:** `GET /processes/{processId}/versions/{versionId}`

**Response:**
```json
{
  "id": "version-uuid-1",
  "tag": "v1.0.0",
  "description": "Initial release with core workflow",
  "createdBy": {
    "id": "user-uuid",
    "name": "Minh Chien",
    "email": "chien@example.com",
    "avatar": "https://..."
  },
  "createdAt": "2025-11-04T14:48:00.000Z",
  "processId": "process-uuid",
  "xml": "<?xml version=\"1.0\"?>...",
  "variables": {},
  "activities": [],
  "isCurrent": false
}
```

---

### 3. Create Version
Creates a new version snapshot of the current process state.

**Endpoint:** `POST /processes/{processId}/versions`

**Request Body:**
```json
{
  "tag": "v1.1.0",
  "description": "Added email notification step"
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| tag | string | Yes | 50 | Version tag/name |
| description | string | No | 255 | Description of changes |

**Response:** `201 Created`
```json
{
  "id": "version-uuid-new",
  "tag": "v1.1.0",
  "description": "Added email notification step",
  "createdBy": {...},
  "createdAt": "2025-11-05T10:30:00.000Z",
  "processId": "process-uuid"
}
```

---

### 4. Update Version
Updates version metadata (tag and description only).

**Endpoint:** `PUT /processes/{processId}/versions/{versionId}`

**Request Body:**
```json
{
  "tag": "v1.1.0-beta",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": "version-uuid",
  "tag": "v1.1.0-beta",
  "description": "Updated description",
  ...
}
```

---

### 5. Delete Version
Deletes a specific version.

**Endpoint:** `DELETE /processes/{processId}/versions/{versionId}`

**Response:** `204 No Content`

---

### 6. Restore Version
Restores a version as the current/latest process state.

**Endpoint:** `POST /processes/{processId}/versions/{versionId}/restore`

**Response:** `200 OK`
```json
{
  "message": "Version restored successfully",
  "restoredVersion": {...}
}
```

---

### 7. Compare Versions
Compares two versions and returns the differences.

**Endpoint:** `GET /processes/{processId}/versions/compare`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| baseVersionId | string | Yes | The base version ID |
| compareVersionId | string | Yes | The version to compare against |

**Response:**
```json
{
  "baseVersion": {...},
  "compareVersion": {...},
  "changes": [
    {
      "id": "change-1",
      "elementId": "Flow_lleygoy",
      "elementName": "Flow_lleygoy",
      "changeType": "added",
      "details": "New sequence flow added"
    },
    {
      "id": "change-2",
      "elementId": "Activity_askEmail",
      "elementName": "Ask customer via email Haha",
      "changeType": "changed",
      "details": "Name changed from 'Ask customer via email'"
    },
    {
      "id": "change-3",
      "elementId": "Activity_saveMemory",
      "elementName": "Save customer interaction in long term memory",
      "changeType": "moved",
      "details": "Position changed"
    }
  ],
  "addedCount": 1,
  "changedCount": 1,
  "movedCount": 1,
  "removedCount": 0
}
```

---

### 8. Download Version
Downloads the BPMN XML file for a specific version.

**Endpoint:** `GET /processes/{processId}/versions/{versionId}/download`

**Response Headers:**
```
Content-Type: application/xml
Content-Disposition: attachment; filename="process-v1.0.0.bpmn"
```

**Response:** Raw BPMN XML content

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Version tag is required",
  "statusCode": 400
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Version not found",
  "statusCode": 404
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Version tag already exists",
  "statusCode": 409
}
```

---

## Autosave Behavior

The system automatically creates "Autosaved" versions before certain actions:
- Before Copilot (AI) generation
- Before major workflow changes
- Periodically during editing (configurable)

Autosaved versions can be identified by:
- `tag` starting with "Autosaved"
- `description` containing "Autosaved before..."

