# Moataz AI — Enterprise AI & Multi-Agent Orchestration Platform

Moataz AI is a high-performance, enterprise-grade, full-stack AI gateway and autonomous agent workspace. Built with a modular, zero-dependency Node.js/TypeScript backend, durable JSON storage, and a responsive React (Vite/Tailwind) frontend, Moataz AI empowers organizations to securely route, audit, cache, and deploy production-ready AI pipelines across 21+ model providers with millisecond-latency and built-in cost guardrails.

---

## 🚀 Key Capabilities

### 🛡️ 1. Enterprise-Grade Security
- **Multi-layered Security Headers**: Native CSP, HSTS, CORS control, XSS mitigation, Clickjacking protection (`X-Frame-Options: DENY`), and MIME sniffing prevention (`X-Content-Type-Options: nosniff`).
- **Cryptographically Redacted Keys & Secure Sessions**: Client API keys are redacted server-side, sessions are managed with high-entropy cryptographic hashes, and RBAC is strictly enforced.
- **Vulnerability Isolation**: Zero SQL-injection vectors thanks to a secure local-first JSON document architecture. Path-traversal defenses on uploads and strict base64 size sanitization.

### 🌐 2. Multi-Model AI Gateway
- **Intelligent Cost Routing**: Auto-optimize model calls with fallback triggers, dynamic provider switches, and semantic caching.
- **Provider Registry**: Native compatibility with Gemini 3.5, OpenAI GPT-4o, Anthropic Claude, Cloudflare Workers AI, Groq Systems, DeepSeek AI, AWS Bedrock, Perplexity AI, and local model APIs (Ollama, LM Studio).
- **Millisecond Latency Streaming**: SSE (Server-Sent Events) streaming architecture supporting concurrent, high-throughput delivery.

### 🤖 3. Multi-Agent Orchestration & Sandboxed Execution
- **Autonomous Runtimes**: Agent Platform engine equipped with planner, reviewer, database administrator, and security auditor agents.
- **Secure Sandbox Execution**: Javascript and Python isolated script runners with robust permission checking.
- **Workflow Automation (DAG)**: Powerful Graph-based DAG (Directed Acyclic Graph) workflow engine to build, trigger, simulate, and persist agent tasks.
- **Semantic Memory Core**: In-memory and disk-backed semantic similarity memory module for local-agent retrieval-augmented generation.

### 📊 4. Real-time Observability & Admin Panel
- **Comprehensive Audit Trails**: Immutable audit logging stream capturing system logins, key creations, cost updates, and provider state alterations.
- **Live Metrics & Graphs**: Recharts-powered graphs analyzing daily usage, token cost distribution, and provider latency analytics.
- **Health Checks & Monitoring**: Structured `/api/health` checking node versions, uptime, database size, provider heartbeat, and storage states.

---

## 🛠️ Technology Stack

- **Frontend**: React (v19), Vite, Tailwind CSS (v4), Motion (for high-fidelity fluid animations), Lucide React.
- **Backend**: Express (v4), TypeScript, tsx, esbuild, dotenv.
- **Database**: Local-Durable JSON database engine with automatic schema upgrades, historical seeding, and in-memory caching.
- **Storage**: Multi-driver Storage Service (AWS S3, local disk upload, signed URL generator with simulated cryptographic signatures).

---

## 📂 Repository Structure

```bash
├── data/                 # Durable database files (.json)
├── server/               # Full-stack backend modules
│   ├── agents/           # Multi-agent registry, platform rules, and validation tests
│   ├── auth/             # Cryptographic authentication and RBAC middlewares
│   ├── db/               # Local-durable database engine and Prisma schemes
│   ├── gateway/          # Abstract multi-provider AI gateway and SSE streamer
│   ├── storage/          # Local-filesystem and S3-compatible cloud storage service
│   └── agentPlatform.ts  # Sandboxes, workflow engines, MCP connections, automation
├── src/                  # React/Vite/Tailwind frontend
│   ├── components/       # Component modular tabs (Admin, Chats, Knowledge Base, etc.)
│   ├── App.tsx           # Main application shell & router
│   ├── main.tsx          # Virtual DOM entry point
│   ├── types.ts          # Unified TS interface types
│   └── index.css         # Tailwind global css configurations
├── server.ts             # Primary full-stack server and REST endpoints entry point
└── package.json          # Dependency manifests and production bundling scripts
```

---

## 📋 Comprehensive Enterprise Documentation

Moataz AI is fully documented for production deployment and development. Access specialized guides below:

1. **[Architecture Guide](ARCHITECTURE.md)**: System design, data flow, multi-agent runtimes, and gateway engineering.
2. **[Installation Guide](INSTALLATION.md)**: Quickstart, dev server setup, and dependency mappings.
3. **[Deployment Blueprint](DEPLOYMENT.md)**: Hardened Docker, Railway, Vercel, and Cloudflare instructions.
4. **[Database Specification](DATABASE.md)**: JSON-Durable Local engine, schema references, and query optimizations.
5. **[Security Architecture](SECURITY.md)**: CSP, Rate limiting, CSRF double-submits, XSS mitigation, and audit logging.
6. **[API Reference](API_REFERENCE.md)**: Request-response schemas for authentication, files, gateway, analytics, and RAG.
7. **[Agent OS Guide](AGENTS.md)**: Customizing system prompts, sandboxes, and agent profiles.
8. **[AI Gateway Integration](AI_GATEWAY.md)**: Dynamic pricing, SSE streaming, routing, and provider failover.
9. **[Workflows Engine](WORKFLOWS.md)**: Building DAG steps, conditional loops, triggers, and automations.
10. **[Admin Guide](ADMIN_GUIDE.md)**: System health, pricing controls, audit stream, and provider failovers.
11. **[Developer Manual](DEVELOPER_GUIDE.md)**: Extensibility guides, component splitting, and code styling.
12. **[Contributing Policy](CONTRIBUTING.md)**: Code reviews, architectural invariants, and pull-request rules.
13. **[Changelog](CHANGELOG.md)**: Version history, features, and enterprise-hardening patches.
14. **[Roadmap](ROADMAP.md)**: Relational DB integrations, vector search clusters, and edge agent runtimes.

---

## 🛡️ License & Enterprise Compliance

Moataz AI is commercial software designed for secure enterprise deployments. All code resides within the private container layer and does not leak API keys, system prompts, or customer logs to the public client context.
