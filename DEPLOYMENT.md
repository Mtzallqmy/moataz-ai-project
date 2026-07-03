# Production Deployment Guide — Moataz AI

This document provides step-by-step production deployment instructions for Moataz AI, supporting Docker, Railway, Vercel, and direct container platforms.

---

## 🔑 Environment Variables Specification

Define these environment variables in your deployment dashboard or production `.env` file. Never commit credentials to the source repository.

```env
# Server Ingress Binding
NODE_ENV=production
PORT=3000

# Security secrets
JWT_SECRET=super_high_entropy_secret_hash_key_for_moataz_prod

# Core AI API Keys (Server-side ONLY)
GEMINI_API_KEY=AIzaSy...

# Optional Provider Keys
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...

# Production S3 Cloud Storage (Optional, local file storage used if keys are absent)
S3_BUCKET_NAME=moataz-ai-uploads
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=abcd...
AWS_REGION=us-east-1
```

---

## 🐳 Docker Container Deployment

Moataz AI is fully containerized. We recommend using a multi-stage Docker configuration to build the frontend assets and bundle the Express backend into a single target.

### 1. Build & Run with Docker Compose
Create a `docker-compose.yml` file at the root:

```yaml
version: '3.8'

services:
  moataz-ai:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: moataz_ai_platform
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=prod_entropy_secret_key_123!
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - moataz-data:/app/data
      - moataz-uploads:/app/uploads
    restart: always

volumes:
  moataz-data:
  moataz-uploads:
```

### 2. Generate Dockerfile
Create a `Dockerfile` at the root of the project:

```dockerfile
# Stage 1: Build Frontend and Backend Bundle
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Container
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/uploads ./uploads

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/server.cjs"]
```

---

## 🚂 Railway Deployment Blueprint

Railway is the recommended cloud platform for hosting Moataz AI.

1. **GitHub Connection**: Import your fork of the Moataz AI repository into your Railway dashboard.
2. **Auto-Detection**: Railway auto-detects Node.js. In the deployment settings, configure the following parameters:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Port Bind**: Set the environment variable `PORT=3000`. Railway will bind internal traffic to this port.
3. **Persistent Volume**: Because Moataz AI utilizes a lightning-fast local-durable JSON store, you **must** mount a persistent volume at `/app/data` and `/app/uploads` to ensure user credentials, conversations, and uploaded files persist across server restarts.
   - Go to your Railway service dashboard -> **Variables** -> Add Volume.
   - Set the mount path to `/app/data`.

---

## 🚀 Vercel / Serverless Considerations

To deploy Moataz AI on serverless hosting like Vercel:
- **Frontend SPA**: Vercel handles the React build out-of-the-box. Ensure your build output directory is set to `dist`.
- **Backend API Server**: Serverless architectures have a 10s-30s timeout and do not support long-running SSE (Server-Sent Events) streaming. If deploying on Vercel, streaming should be turned off in the preferences tab, or the Express backend should be deployed to a stateful container (like Railway or Google Cloud Run) with the React frontend pointing to the container URL.
