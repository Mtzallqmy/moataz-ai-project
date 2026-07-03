# Agent Platform (Agent OS) Guide — Moataz AI

This document details the multi-agent orchestration runtime, isolated sandbox execution, and local semantic memory layers built into the Moataz AI platform.

---

## 🤖 Platform Orchestration Engine

The Agent Platform (managed in `/server/agentPlatform.ts` and `/server/agents/platform.ts`) runs as an autonomous agent operating system:

1. **System Registration**: Agents are initialized with standard system templates, active capability flags, tool access tokens, and LLM preferences.
2. **Capability Constraints**: Specific capability flags restrict agent actions:
   - `execute_code`: Grants script sandbox execution rights.
   - `read_files`: Allows reading project workspace attachments.
   - `web_search`: Authorizes external search calls.
3. **Seeded Profiles**: Our database seeds 10 specialized agent roles on startup:
   - **Planner Agent (`agt-planner`)**: Orchestrates and divides complex tasks.
   - **Reviewer Agent (`agt-reviewer`)**: Reviews code and text outputs for quality.
   - **Database Admin Agent (`agt-db-admin`)**: Formats tables and audits data structures.
   - **Security Auditor Agent (`agt-auditor`)**: Inspects code for OWASP vulnerabilities.

---

## 🔒 Code Sandbox Execution

Moataz AI isolates code execution to prevent system compromise, resource exhaustion, or host escape:

### 1. JavaScript VM Environment
- Uses Express's built-in sandbox modules with customized scopes.
- Context objects (such as `console`, `Buffer`, and temporary arrays) are frozen.
- Access to high-impact Node structures (e.g., `process`, `require`, `fs`, `http`, `child_process`) is **disabled**.
- CPU execution limits and timeouts prevent infinite loops.

### 2. Python Isolation & Permission Restrictions
- Executes within simulated, isolated environments.
- Scans input scripts for dangerous keywords (`import os`, `import sys`, `subprocess`, `socket`, `shutil`).
- If blocked libraries are detected, the runner blocks execution, registers a `PermissionError`, and logs the attempt to the administrative security audit panel.

---

## 🧠 Semantic Similarity Memory Core

To prevent token bloating and support context-aware agent interactions, Moataz AI implements a local semantic memory core:

- **Insertion**: Memories are stored as nodes in `/server/agentPlatform.ts` with metadata, project tags, and timestamp indexes.
- **Search Retrieval**: Calculates structural and lexical similarities between query prompts and stored memories:
  - Tokenizes terms and builds weight vectors.
  - Computes overlap frequencies using sub-millisecond keyword indexing.
  - Matches the highest semantic relevance scores, serving as a low-latency context builder for local Agent retrieval-augmented generation (RAG).
- **TTL Decay**: Older memories decay in relevance over time unless reinforced, keeping active context focused on the current task.
