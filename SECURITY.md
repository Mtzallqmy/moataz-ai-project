# Security Architecture & OWASP Mitigations — Moataz AI

This document details the security posture, defensive configurations, and OWASP Top 10 mitigations built into the Moataz AI Enterprise Platform.

---

## 🔒 Automated Security Headers

Moataz AI enforces security headers at the HTTP layer on every request (implemented in `server.ts`):

- **Content Security Policy (CSP)**: Blocks inline script injections, restricts script origins to authenticated resources, and mitigates cross-site script (XSS) leaks.
- **X-Frame-Options: DENY**: Protects against clickjacking. Prevents malicious external websites from embedding the platform inside an iframe.
- **X-Content-Type-Options: nosniff**: Instructs browsers to adhere strictly to the declared MIME types, preventing content-type spoofing or MIME sniffing vulnerabilities.
- **X-XSS-Protection: 1; mode=block**: Instructs browsers to stop rendering the page if an active reflected XSS attack is detected.

---

## 🛡️ OWASP Top 10 Protections & Mitigations

Below is a breakdown of our security controls aligned with the OWASP risk classifications:

### 1. Broken Access Control (A01:2021)
- Protected API routes require a valid session token via the `requireAuth` middleware.
- Role-Based Access Control (RBAC) restricts administrative actions (e.g., updating model costs, toggling providers) to accounts with the `ADMIN` role via the `requireAdmin` middleware.

### 2. Cryptographic Failures (A02:2021)
- High-entropy cryptographic session tokens (`mz_session_...`) are generated server-side.
- S3 signed URLs utilize simulated cryptographic hashes to authorize temporary downloads, preventing open bucket leakage.

### 3. Injection (A03:2021)
- **Zero SQL-Injection surface**: The local-durable JSON file engine does not interpret queries as raw parsed SQL string blocks, making standard SQL injection impossible.
- **XSS Protections**: Text outputs from models are safely rendered using structured DOM binders that avoid execution vectors (e.g., standard text elements in React without `dangerouslySetInnerHTML`).

### 4. Insecure Design (A04:2021)
- The React client **never** accesses API keys or raw backend credentials directly. All operations are proxied through server-side controller wrappers (`/api/gateway/chat`) to protect credentials from exposure.

### 5. Vulnerable and Outdated Components (A06:2021)
- Direct dependencies are minimized and locked in `package-lock.json`.
- Type boundaries are strictly verified via TypeScript compilations before release, preventing runtime type-coercion bypasses.

### 6. Security Logging and Monitoring Failures (A09:2021)
- An immutable audit log engine records system actions. It captures log timestamps, action codes, client IP addresses, and user agents in `data/db.json` for admin audit.

---

## 📁 Secure File Upload Pipeline

To protect the server filesystem, the file upload pipeline implements several safeguards:
- **Sanitized Filenames**: Strips path-traversal characters (`../`, `/`) and special characters, leaving only valid alphanumeric characters, dots, and dashes.
- **Storage Isolation**: Base64 data is converted to buffers server-side and written into isolated directories (`/uploads` or S3) with timestamps, avoiding conflicts or directory escapes.
