# Changelog — Moataz AI

This document tracks release histories, major feature additions, security enhancements, and performance optimizations for the Moataz AI Enterprise Platform.

---

## [1.2.0] — 2026-07-02
This release focuses on enterprise-grade security hardening, performance optimizations, and comprehensive documentation.

### Added
- **Complete Enterprise Security**: Native integration of CORS, Helmet-equivalent CSP, MIME-sniffing protection, Clickjacking defenses, and cross-site scripting (XSS) mitigation.
- **Advanced Code Sandboxes**: Added Python isolation and import scanners to prevent system compromise or container escape.
- **Robust Database Schema Seeding**: Automatically registers 21+ AI Providers, seeds administrator accounts, and pre-populates analytics data logs.
- **S3 Storage Fallback**: Modular S3-compatible cloud storage driver with automatic local-disk fallback.
- **Comprehensive Documentation**: Added 15 developer, admin, database, and architecture manuals.

### Optimized
- **Non-blocking SSE Streaming**: Optimised server-sent event loops to reduce stream overhead and latency.
- **Bundled Build Pipeline**: Configured Vite and `esbuild` to bundle React assets and compile backend Node files into a single, highly optimized `dist/server.cjs` bundle.

### Fixed
- **State Preservation**: Resolved file-lock and file-write racing conditions on parallel database updates.
- **Route Validation**: Added explicit type validations to `/api/files` and `/api/gateway/chat` payloads.

---

## [1.1.0] — 2026-06-15
Introduced multi-agent runtimes, semantic memory support, and DAG workflows.

### Added
- **Multi-Agent Orchestration**: Seeded specialized planner, reviewer, and auditor profiles.
- **Workflow Automation (DAG)**: Built stateful Directed Acyclic Graph execution engine.
- **Semantic Memory**: Added in-memory keyword-matching and similarity indexing.

---

## [1.0.0] — 2026-05-10
Initial release of the Moataz AI platform.

### Added
- **Multi-Model Proxy**: Initial gateway implementation with routing support.
- **Workspace Organizer**: Core workspace folders, file uploads, and attachment management.
- **Interactive Chat**: Standard chat UI with history and markdown rendering.
- **Analytical Metrics**: Recharts-powered token consumption charts and dashboard views.
- **Basic Auth**: Cookie and session authentication.
