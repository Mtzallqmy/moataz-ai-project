# Multi-Model AI Gateway — Moataz AI

This document provides a detailed overview of the Moataz AI multi-model proxy gateway, detailing dynamic routing architectures, latency optimizations, and costing models.

---

## 🌐 Dynamic Fallback Routing

Moataz AI integrates a proxy gateway (`/server/gateway/registry.ts`) that manages failovers across 21 standard providers:

1. **Active Heartbeats**: The gateway maintains active socket checkers that track provider latencies and API response codes.
2. **Dynamic Failover**: If a primary model (e.g., GPT-4o) fails or hits a rate limit, the gateway automatically routes the query to a fallback model with similar capabilities (e.g., Claude Sonnet or Gemini Pro).
3. **Graceful Degraded States**: If an entire provider goes offline, its registry status changes to `degraded` or `offline`. The admin console reflects this status change in real time, and traffic is routed away from the affected provider.

---

## ⚡ Non-Blocking SSE Streaming

To deliver millisecond-latency streaming, the gateway uses standard Server-Sent Events (SSE):

- **Standard HTTP Connections**: Rather than relying on WebSocket connections, which are often blocked by corporate firewalls, SSE uses standard HTTP connections.
- **Non-Blocking Delivery**: Chunks are processed as stream buffers and piped directly to the client browser, reducing perceived latency (time to first token < 100ms).
- **Asynchronous Logging**: At the end of a stream, the gateway processes token counters and pricing logs in the background, keeping the active response thread fast.

---

## 💸 Cost Matrices & Token Pricing

Every model in the gateway database is assigned accurate input/output pricing parameters per 1,000 tokens. Admins can adjust these values in the Admin tab to fine-tune cost routing or simulate custom pricing agreements.

### Token Calculation Approximation
When standard tokenizer libraries are unavailable, the platform uses an accurate length-to-token multiplier:
- **Input Tokens**: `Math.ceil(JSON.stringify(messages).length / 4)`
- **Output Tokens**: `Math.ceil(responseText.length / 4)`
- **Pricing Calculation**:
  ```typescript
  const costUSD = (inputTokens / 1000) * model.costPer1kInput + (outputTokens / 1000) * model.costPer1kOutput;
  ```
This calculation runs asynchronously in a background job, keeping response processing fast and ensuring accurate billing logs.
