# Developer Extension Manual — Moataz AI

This document provides a technical guide for developers extending the Moataz AI platform, explaining code standards, component structures, and backend extension patterns.

---

## 🛠️ Code Standards & Tech Stack

Developers must adhere to these structural constraints to maintain platform stability and performance:
- **TypeScript & Type Safety**: Declare types early and explicitly. Avoid `any` types where possible. Always define models in `src/types.ts` and `/server/db/engine.ts`.
- **Modularity**: Avoid large, monolithic files. Move complex sub-components out of `App.tsx` into `/src/components/` and separate utility logic into helper modules.
- **Styling**: Style UI elements exclusively with Tailwind CSS utility classes. Avoid inline style attributes or separate CSS sheets.
- **Icons**: Import all icons from `lucide-react` to maintain a consistent design language.

---

## 🖥️ Extending the React Frontend

The React frontend uses a tabbed navigation structure managed in `src/App.tsx`.

To add a new view or feature tab:
1. Define the state interface in `/src/types.ts`.
2. Create a new component file in `/src/components/` (e.g., `CustomAnalyticsTab.tsx`).
3. Add the tab ID to the navigation state in `src/App.tsx`.
4. Import and register the new component inside the main switch-render block:

```tsx
case "custom-analytics":
  return <CustomAnalyticsTab token={token} activeProjectId={activeProjectId} />;
```

---

## ⚙️ Extending the Express Backend

Backend API routes are registered in `server.ts`. Follow these guidelines when adding new endpoints:

1. **Verify Authorization**: Protect routes using the `requireAuth` middleware to ensure only authenticated users can access them:
   ```typescript
   app.post("/api/custom-route", requireAuth as any, (req: AuthenticatedRequest, res) => { ... });
   ```
2. **Access the Database**: Perform CRUD operations through the database engine API defined in `/server/db/engine.ts`:
   ```typescript
   const data = db.getProjects().filter(p => p.userId === req.user!.id);
   ```
3. **Handle Errors Gracefully**: Always wrap controller logic in `try-catch` blocks and return appropriate HTTP status codes:
   ```typescript
   try {
     ...
     return res.status(201).json(result);
   } catch (e: any) {
     return res.status(500).json({ error: e.message });
   }
   ```
