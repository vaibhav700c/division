# API Reference

## Base URL
\`\`\`
http://localhost:3001/api
\`\`\`

## Authentication
All requests should include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Tasks

### List Tasks
\`\`\`
GET /tasks
Query Parameters:
  - status: TaskStatus (optional)
  - priority: TaskPriority (optional)
  - teamId: string (optional)
  - assignedTo: string (optional)

Response:
{
  "data": [Task],
  "total": number,
  "page": number,
  "limit": number
}
\`\`\`

### Create Task
\`\`\`
POST /tasks
Body:
{
  "title": string,
  "description": string,
  "priority": TaskPriority,
  "assignedTo": string,
  "teamId": string,
  "estimatedHours": number,
  "dueDate": ISO8601,
  "tags": string[],
  "location": {
    "address": string,
    "latitude": number,
    "longitude": number
  }
}

Response: Task
\`\`\`

### Get Task
\`\`\`
GET /tasks/:id
Response: Task
\`\`\`

### Update Task
\`\`\`
PUT /tasks/:id
Body: Partial<Task>
Response: Task
\`\`\`

### Delete Task
\`\`\`
DELETE /tasks/:id
Response: { success: boolean }
\`\`\`

## Approvals

### List Approvals
\`\`\`
GET /approvals
Query Parameters:
  - status: ApprovalStatus (optional)
  - taskId: string (optional)

Response:
{
  "data": [Approval],
  "total": number
}
\`\`\`

### Approve Task
\`\`\`
POST /approvals/:id/approve
Body:
{
  "comments": string (optional)
}

Response: Approval
\`\`\`

### Reject Task
\`\`\`
POST /approvals/:id/reject
Body:
{
  "reason": string,
  "comments": string (optional)
}

Response: Approval
\`\`\`

### Escalate Approval
\`\`\`
POST /approvals/:id/escalate
Body:
{
  "reason": string
}

Response: Approval
\`\`\`

## AI Features

### Generate Task Suggestions
\`\`\`
POST /ai/suggestions
Body:
{
  "teamId": string (optional),
  "limit": number (default: 5)
}

Response:
{
  "suggestions": [TaskSuggestion],
  "generatedAt": ISO8601
}
\`\`\`

### Analyze Workload
\`\`\`
POST /ai/workload
Body:
{
  "teamId": string (optional)
}

Response:
{
  "data": [WorkloadData],
  "generatedAt": ISO8601
}
\`\`\`

### Generate Meeting Minutes
\`\`\`
POST /ai/meeting-minutes
Body:
{
  "title": string,
  "notes": string,
  "attendees": string[] (optional)
}

Response: MeetingMinutes
\`\`\`

## Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "Invalid request parameters",
  "details": {}
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Authentication required"
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "error": "Insufficient permissions"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Resource not found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal server error",
  "requestId": "uuid"
}
\`\`\`

## Rate Limiting

- Rate limit: 100 requests per minute per user
- Headers:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1634567890`

## Pagination

List endpoints support pagination:
\`\`\`
GET /tasks?page=1&limit=20
\`\`\`

Response includes:
\`\`\`json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
