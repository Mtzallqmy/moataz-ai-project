# Installation & Setup Guide — Moataz AI

This document details the local environment installation and verification instructions for developers setting up Moataz AI.

---

## 📋 Prerequisites

Before setting up Moataz AI, ensure your system meets these specifications:
- **Node.js**: `v20.x` or `v22.x` (LTS versions)
- **Package Manager**: npm (standard node bundle)
- **API Key**: A valid Google Gemini API Key. You can obtain one from the [Google AI Studio Console](https://aistudio.google.com).

---

## ⚙️ Quickstart Installation

Follow these commands to install, seed, and boot your local developer container:

### 1. Clone & Navigate
Navigate into the repository root:
```bash
cd moataz-ai-platform
```

### 2. Configure Environment variables
Duplicate our production example template:
```bash
cp .env.example .env
```
Open `.env` and configure your API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
JWT_SECRET=use_a_secure_cryptographic_salt_locally
```

### 3. Install Dependencies
Run a clean install to populate your `node_modules` structure:
```bash
npm install
```

### 4. Boot Dev Server
Start the Express server and Vite development proxy simultaneously:
```bash
npm run dev
```

The system will initialize, seed the database, and bind to port `3000`. Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🛠️ Verification & Build Commands

Moataz AI is equipped with scripts for testing, formatting, and compilation:

### 1. Code Linting & Static Typing Check
To run the TypeScript type checks without outputting build files:
```bash
npm run lint
```

### 2. Clean Local Files
Removes any build artifacts, temporary logs, and resets database caches:
```bash
npm run clean
```

### 3. Production Compilation Build
Compiles your client React assets using Vite, bundles the backend `server.ts` with `esbuild`, formats files into CommonJS modules, and outputs files into `dist/`:
```bash
npm run build
```

### 4. Start Production Server
Boots the compiled CommonJS server using native node performance flags:
```bash
npm run start
```
