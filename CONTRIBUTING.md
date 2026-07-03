# Contribution Guidelines — Moataz AI

Thank you for contributing to Moataz AI. This document outlines branch management, code review processes, and core architectural guidelines to maintain platform quality.

---

## 🛠️ Contribution Workflow

To suggest changes or additions to the platform, follow this workflow:

1. **Create a Feature Branch**: Branch off from `main` using a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Implement Changes**: Adhere to our TypeScript, modular coding, and styling standards.
3. **Run Type Checks**: Ensure there are no type or syntax errors before committing:
   ```bash
   npm run lint
   ```
4. **Build the Platform**: Verify the project builds successfully:
   ```bash
   npm run build
   ```
5. **Submit a Pull Request**: Push your branch to GitHub and open a pull request against the `main` branch. Provide a detailed description of your changes, the problem solved, and test verification results.

---

## 🛡️ Core Architectural Invariants

To keep the platform secure, performant, and stable, all contributions must respect these rules:

- **No Public API Keys**: Never expose API keys, credentials, or secrets to the client. All third-party API calls must be proxied through the Express backend.
- **Durable File Writes**: When modifying the database state, always call the `db.save()` helper to persist changes to `data/db.json`.
- **Sandbox Isolation**: Any tool execution, Python script running, or dynamically evaluated logic must use the isolated VM sandbox wrapper to prevent container escapes.
- **Fluid UI Performance**: Ensure frontend rendering remains fast. Memoize heavy components, use Tailwind CSS for styling, and manage state efficiently to avoid unnecessary re-renders.
- **Consistent Icons**: Always import icons from `lucide-react` instead of creating inline SVG components.
- **No Mock Implementations**: All new API routes, integrations, and services must contain real, production-ready code with graceful error handling. Mock data and placeholders are not permitted.
