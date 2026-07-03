# Architecture Blueprint — Moataz AI

This document provides a highly detailed engineering overview of the Moataz AI system architecture, detailing our backend-to-frontend bridge, our modular state engine, and our isolated agent sandboxes.

---

## 🏗️ Core System Layout

Moataz AI is designed around a decoupled, full-stack architecture that maximizes local isolation, zero-dependency reliability, and responsive rendering.

```
       ┌─────────────────────────────────────────────────────────┐
       │                 REACTION VITE FRONTEND                  │
       │  (Tabs: Admin, Chats, Workflows, RAG, Analytics, Prompts)│
       └────────────────────────────┬────────────────────────────┘
                                    │
                       HTTP (REST)  │  SSE (Streaming data)
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                EXPRESS BACKEND ENGINE                   │
       │  (CORS, Content-Security-Policy, Request Sanitization)   │
       └──────┬───────────────┬───────────────────┬──────────────┘
              │               │                   │
              ▼               ▼                   ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
     │  DATABASE    │  │  STORAGE     │  │  AGENT OS        │
     │  ENGINE      │  │  SERVICE     │  │  PLATFORM        │
     │  (db.json)   │  │  (S3 / Disk) │  │  (Platform.ts)   │
     └──────────────┘  └──────────────┘  └────────┬─────────┘
                                                  │
                               ┌──────────────────┴──────────────────┐
                               │                                     │
                               ▼                                     ▼
                      ┌──────────────────┐                  ┌──────────────────┐
                      │  AI GATEWAY      │                  │  SANDBOXES & DAG │
                      │  REGISTRY        │                  │  (Javascript,    │
                      │  (21+ Providers) │                  │   Python, Workflow)│
                      └──────────────────┘                  └──────────────────┘
```

---

## 🛡️ Backend Processing Layer

The backend runs on an Express.js engine that processes routing, authentication, multi-model execution, and sandboxing:

1. **Authentication (RBAC)**: Located in `server/auth/index.ts`. All protected routes must pass the `requireAuth` middleware. If a route requires high-level parameter overrides, the `requireAdmin` middleware ensures only users with the `ADMIN` role can access it.
2. **Local-Durable Database State**: Managed via `DatabaseEngine` in `server/db/engine.ts`. The state is held in-memory for instant read operations (latency < 1ms) and written to the filesystem at `data/db.json` asynchronously upon mutations.
3. **Multi-Model Routing Engine**: Contained in `server/gateway/registry.ts`. It acts as an abstraction layer across `GoogleGenAI` and standard REST endpoints.
4. **Agent OS Platforms**: Implemented in `server/agents/platform.ts` and `server/agentPlatform.ts`. It orchestrates multi-agent runs, memory retrievals, MCP server hooks, and code sanitization blocks.

---

## 🤖 Multi-Agent Platform & Sandboxing

The Agent Platform manages collaborative operations through isolated workers.

### 1. Isolated Sandboxing (`agentPlatform.ts`)
The `sandboxExecute` engine executes untrusted JavaScript or Python scripts inside isolated runtimes.
- **JavaScript Execution**: Uses safe `vm` context boundaries with frozen global objects, blocking filesystem, network, and system level calls.
- **Python Execution**: Simulates isolated virtual containers. It evaluates command lines, strips hazardous imports (`os`, `sys`, `subprocess`, `socket`), and triggers a simulated `PermissionError` when security violations are detected.

### 2. Directed Acyclic Graph (DAG) Workflow Engine
The `WorkflowEngine` executes workflows as stateful step sequences.
- **Node Execution**: Steps of type `tool_call` are routed through the `ToolExecutionGateway`. Steps of type `agent_task` are dispatched to specific agent profiles (e.g., Planner, Security Auditor).
- **Failure Recovery**: Incorporates automatic state rollbacks. When a node fails, the run status changes to `failed`, triggering cleanup routines and capturing error stacks inside the database logs for admin inspection.

### 3. Model Context Protocol (MCP) Client
The `McpClientService` coordinates integrations with external servers (e.g., GitHub, Slack, databases). It dynamically queries `/discovery` endpoints, retrieves exposed tools lists, and formats argument structures into uniform schemas matching our AI Gateway requirements.

### 4. Semantic Memory Engine
The `MemoryEngine` facilitates local vector-like storage. It breaks input sentences, calculates structural overlap vectors, hashes keyword frequencies, and retrieves semantically related nodes using cosine similarity approximations, providing RAG context with sub-millisecond overhead.

---

## 📊 Analytics & Streaming Pipeline

The platform uses a fully non-blocking streaming pipeline:

- **SSE Streaming**: Dynamic API proxies route streaming responses. Rather than holding standard HTTP buffers in memory, Express streams chunks directly to the client as `text/event-stream`.
- **Dynamic Usage Aggregator**: At the end of every SSE connection, a background job fires asynchronously to calculate tokens (using high-accuracy length-to-token multipliers), compute cost metrics based on active pricing parameters, and log records to the platform's usage metrics tables.
