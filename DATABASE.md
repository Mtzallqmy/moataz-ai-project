# Database Reference Manual — Moataz AI

This document details the database architecture of Moataz AI, including our data model schema, entity relationships, seeding values, and backups management.

---

## 🗄️ Core Design Philosophy

Moataz AI utilizes a specialized, lightweight, local-durable JSON file engine (`/server/db/engine.ts`). 
- **Sub-Millisecond Reads**: All collections are loaded into memory on server boot. Read queries (such as listing folders or finding project models) are completed instantly without disk I/O.
- **Asynchronous Safe Writes**: Mutations write the new state block to memory first, then queue an asynchronous write-to-disk operation to `data/db.json` asynchronously.
- **Zero-Configuration Setup**: Perfect for sandbox, serverless containers, and quick setups. No database provisioning is needed.

---

## 📊 Database Schema Entity Definitions

The schema is defined in TypeScript. Below are the key entity models matching our seed structures:

### 1. User (`User`)
Represents registered users or platform administrators.
- `id`: Unique user string (e.g., `usr-admin`).
- `email`: Normalized lowercase login string.
- `passwordHash`: Plain-text/hashed password for direct validation.
- `role`: Role flags (`USER` or `ADMIN`).

### 2. Provider (`Provider`)
AI Model providers loaded into the gateway's registry.
- `id`: Provider key (e.g., `prov-google`).
- `name`: User-facing name (e.g., `Google Gemini`).
- `apiType`: API standard (`gemini`, `openai`, `anthropic`).
- `isActive`: Boolean routing toggle.
- `healthStatus`: Status (`healthy`, `degraded`, `offline`).

### 3. Model (`Model`)
Individual AI Models linked to providers.
- `id`: Unique identifier (e.g., `model-gemini-flash`).
- `providerId`: Foreign key linking to `Provider.id`.
- `name`: Display label (e.g., `Gemini 3.5 Flash`).
- `apiName`: Actual API call name (e.g., `gemini-3.5-flash`).
- `costPer1kInput`: Cost per 1,000 input tokens in USD.
- `costPer1kOutput`: Cost per 1,000 output tokens in USD.
- `isActive`: Routing state toggle.

### 4. Conversation (`Conversation`)
Chat sessions.
- `id`: Unique conversation key (e.g., `conv-1`).
- `title`: Subject title.
- `projectId`: Foreign key linking to `Project.id`.
- `userId`: Foreign key linking to `User.id`.
- `modelId`: String matching active `Model.apiName`.

### 5. Message (`Message`)
Individual messages inside a conversation.
- `id`: Unique message ID.
- `conversationId`: Foreign key to `Conversation.id`.
- `role`: Actor flag (`system`, `user`, `assistant`).
- `content`: Text body of the message.
- `tokenCount`: Calculated input or output tokens.
- `cost`: Cost calculation in USD.

---

## 🌱 Seeding & Schema Migrations

The database engine features **automatic, self-healing sync protocols**:
- On server initialization, the engine checks for the file `data/db.json`.
- If the file is absent, it executes `seed()`, creating folders and populating records:
  - Seeds **21 AI Providers** and active models.
  - Generates primary Administrator account (`mohmmedabdue0@gmail.com` with password `admin123`) and developer Workspace.
  - Seeds initial historical cost-analysis log sets for analytics displays.
- If the file exists but some collections (like `kbCollections` or `mcpServers`) are missing due to a framework upgrade, the engine **auto-upgrades** the database schema in place without data loss, then runs a secure database save.

---

## 💾 Backups & Disaster Recovery

### 1. Manual Backup
To back up the database, copy the JSON storage file to a secure directory:
```bash
cp data/db.json backups/db_backup_$(date +%F).json
```

### 2. Disaster Recovery Restore
To restore from a backup, stop the server, overwrite the `db.json` file, and restart the server:
```bash
cp backups/db_backup_2026-07-02.json data/db.json
npm run start
```
The server will boot with the restored credentials, historical records, and file logs immediately.
