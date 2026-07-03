# Workflow Automation Engine — Moataz AI

This document provides a detailed overview of the Moataz AI Workflow Automation Engine, explaining our graph-based DAG (Directed Acyclic Graph) executor, step triggers, and run execution logging.

---

## 📈 Graph-Based (DAG) Executor

The Workflow Engine (defined in `/server/agentPlatform.ts`) executes multi-step automation pipelines represented as Directed Acyclic Graphs (DAGs):

- **Sequential & Parallel Processing**: Nodes declare transition lists (`nextNodes`). Nodes with overlapping paths run in parallel, while dependent nodes await prerequisite completion.
- **Node Type Handlers**:
  - `tool_call`: Dispatches tasks to external utilities (e.g., executing web searches, fetching documents, parsing OCR text).
  - `agent_task`: Routes state context to an agent profile, using its system prompt and LLM preference to generate the next state.
  - `condition`: Evaluates the output of a prior node against a criteria rule, branching the flow to different transition lists.
  - `wait`: Pauses execution for a specified duration before triggering the next node.

---

## ⏰ Cron & Webhook Trigger Engine

Workflows can be triggered by several event sources:

- **Cron Automations**: Defined in `AutomationRule`. Schedules recurring runs (e.g., "every Monday at 8 AM" or "every 5 minutes") using our built-in scheduler.
- **Webhook Events**: Exposes endpoint routes `/api/workflows/trigger/:id` to start workflows from external alerts or CI/CD pipelines.
- **Workspace Events**: Listens for file uploads or document index completions to automatically trigger processing workflows (e.g., extracting summaries from newly uploaded files).

---

## 📊 Run Tracking & Rollback recovery

Every execution run generates a `WorkflowLog` entry in the database:
- **Comprehensive Logging**: Stores execution times, token costs, and logs for each step.
- **Automatic Rollbacks**: If a node fails, the workflow engine stops the active run, rolls back state mutations, logs the error stack to `data/db.json`, and triggers an admin alert.
- **Resumable Runs**: Failed workflows can be retried from the last successful step, avoiding redundant API costs for completed stages.
