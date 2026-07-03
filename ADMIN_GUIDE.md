# Administration Console Guide — Moataz AI

This document details the administrative operations of Moataz AI, including managing system health, adjusting model pricing, configuring failovers, and monitoring audit logs.

---

## 💻 Accessing the Admin Console

The Admin Console is restricted to users with the `ADMIN` role. 

To access the console:
1. Log in with an administrator account (e.g., `mohmmedabdue0@gmail.com` / `admin123`).
2. Click the **Admin Tab** in the primary navigation sidebar.
3. If the tab is missing, verify the user role in `data/db.json` is set to `"role": "ADMIN"`.

---

## 📊 Core Administrative Functions

The Admin Console provides centralized control over key platform configurations:

### 1. Model Configuration & Pricing Controls
Allows admins to update input/output token pricing in real time to match provider changes or custom agreements:
- Navigate to **Models Config & cost thresholds**.
- Select a model and click **Update cost metrics**.
- Adjust input/output pricing per 1,000 tokens and click **Save**.
- Updates apply to all subsequent billing calculations immediately.

### 2. Registry Failover Control
Enables admins to manually toggle providers or configure failover routes to handle API outages:
- Navigate to **Registry Routing failovers**.
- Click the toggle switch next to a provider to enable or disable it.
- Disabling a provider immediately reroutes active workflows and chat sessions to fallback models.

### 3. System Security Audit Log Stream
Provides a live view of security events across the platform:
- Logins, registrations, API key creations, subscription changes, and administrative overrides are logged automatically.
- Logs include timestamps, event types, client IP addresses, and user-agent strings.
- Audit logs are stored in `data/db.json` and can be exported by security teams.

---

## 📈 Platform Health Monitoring

The `/api/health` endpoint provides detailed diagnostic information about the platform's state:

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

Monitor this endpoint using tools like Prometheus, Grafana, or basic HTTP pingers to track platform health and trigger alerts for degraded provider status.
