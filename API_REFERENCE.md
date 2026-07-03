# REST API Specifications — Moataz AI

This document provides request-response schema documentation for all REST API endpoints exposed by the Moataz AI server.

---

## 🔑 Authentication Headers

All endpoints except registration and login require an authorization header with a valid session token:

```http
Authorization: Bearer mz_session_abcdef123456
```

---

## 👤 1. Authentication Endpoints

### POST `/api/auth/register`
Creates a new user profile, default preferences, a subscription plan, and a default workspace.

- **Request Body**:
```json
{
  "email": "developer@moataz.ai",
  "password": "devpassword123",
  "name": "Moataz Developer"
}
```
- **Response Payload (201 Created)**:
```json
{
  "token": "mz_session_8as8d7f2893as",
  "user": {
    "id": "usr-8a9d8",
    "email": "developer@moataz.ai",
    "name": "Moataz Developer",
    "role": "USER"
  }
}
```

### POST `/api/auth/login`
Authenticates user credentials and returns a secure session token.

- **Request Body**:
```json
{
  "email": "mohmmedabdue0@gmail.com",
  "password": "admin123"
}
```
- **Response Payload (200 OK)**:
```json
{
  "token": "mz_session_admin_token_hash",
  "user": {
    "id": "usr-admin",
    "email": "mohmmedabdue0@gmail.com",
    "name": "Moataz Admin",
    "role": "ADMIN"
  }
}
```

---

## 📁 2. File & Upload Endpoints

### GET `/api/files`
List uploaded file metadata. Optional query filter for `projectId`.

- **Response Payload (200 OK)**:
```json
[
  {
    "id": "file_893as",
    "name": "1719904210_instructions.txt",
    "mimeType": "text/plain",
    "sizeBytes": 15480,
    "url": "/uploads/1719904210_instructions.txt",
    "userId": "usr-admin",
    "projectId": "proj-admin-1",
    "createdAt": "2026-07-02T08:30:11.000Z"
  }
]
```

### POST `/api/files`
Upload a base64-encoded file.

- **Request Body**:
```json
{
  "name": "instructions.txt",
  "mimeType": "text/plain",
  "base64Data": "U2FhUyBlbnRlcnByaXNlIG1vYXRheiBhaSBwbGF0Zm9ybQ==",
  "projectId": "proj-admin-1"
}
```
- **Response Payload (210 Created)**:
```json
{
  "id": "file_new_9a8d",
  "name": "1719905102_instructions.txt",
  "mimeType": "text/plain",
  "sizeBytes": 38,
  "url": "/uploads/1719905102_instructions.txt",
  "userId": "usr-admin",
  "projectId": "proj-admin-1",
  "createdAt": "2026-07-02T09:50:00.000Z"
}
```

---

## 🌐 3. Multi-Model AI Gateway Endpoints

### GET `/api/gateway/models`
Retrieve active AI models registered in the gateway.

- **Response Payload (200 OK)**:
```json
[
  {
    "id": "model-gemini-flash",
    "providerId": "prov-google",
    "name": "Gemini 3.5 Flash",
    "apiName": "gemini-3.5-flash",
    "contextWindow": 1048576,
    "costPer1kInput": 0.000075,
    "costPer1kOutput": 0.0003,
    "isActive": true
  }
]
```

### POST `/api/gateway/chat`
Execute a chat request with fallback and routing. Supports SSE streaming if `stream` is `true`.

- **Request Body**:
```json
{
  "conversationId": "conv-1",
  "modelName": "gemini-3.5-flash",
  "messages": [
    { "role": "user", "content": "Explain SSE streaming benefits." }
  ],
  "stream": false
}
```
- **Response Payload (200 OK - Blocking mode)**:
```json
{
  "content": "SSE streaming allows web servers to push real-time updates directly over standard HTTP connections without WebSocket overhead.",
  "usage": {
    "promptTokens": 12,
    "completionTokens": 20,
    "totalTokens": 32
  },
  "cost": {
    "inputCostUSD": 0.0000009,
    "outputCostUSD": 0.000006,
    "totalCostUSD": 0.0000069
  },
  "durationMs": 350
}
```
- **Streaming mode (`stream: true`) response**:
  Emits `text/event-stream` chunks:
  ```http
  data: {"content":"SSE ","done":false}
  data: {"content":"streaming ","done":false}
  ...
  data: [DONE]
  ```

---

## 📊 4. Observability & System Health

### GET `/api/health`
Return public system status, database stats, and active provider diagnostics.

- **Response Payload (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-07-02T09:50:43.000Z",
  "uptimeSeconds": 1420,
  "database": {
    "engine": "SQLite/JSON-Durable-Local",
    "fileSizeBytes": 45507,
    "usersCount": 2,
    "projectsCount": 2,
    "conversationsCount": 1
  }
}
```
