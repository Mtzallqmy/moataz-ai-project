import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import pinoPretty from 'pino-pretty';
import * as Sentry from "@sentry/node";
import { PrismaClient } from '@prisma/client';
import { gatewayRegistry } from './server/gateway/registry.js';
import { checkDatabaseHealth } from './server/db/health.js';
import { 
  registerController, 
  loginController, 
  logoutController, 
  requireAuth, 
  AuthenticatedRequest 
} from './server/auth/index.js';

const logger = pino(pinoPretty());
const prisma = new PrismaClient();
const app = express();

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}

// Run DB Health Check
checkDatabaseHealth();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Auth Endpoints
app.post('/api/auth/register', registerController);
app.post('/api/auth/login', loginController);
app.post('/api/auth/logout', requireAuth as any, logoutController as any);

app.get('/api/auth/me', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// Projects Endpoints
app.get('/api/projects', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const projects = await prisma.project.findMany({ where: { userId: req.user!.id } });
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

app.post('/api/projects', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: { name, description, userId: req.user!.id }
    });
    res.status(201).json(project);
  } catch (e) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

// AI Gateway Endpoints
app.get('/api/gateway/models', async (req, res) => {
  const models = await gatewayRegistry.discoverModels();
  res.json(models);
});

app.get('/api/gateway/providers', async (req, res) => {
  try {
    const status = await gatewayRegistry.getProvidersStatus();
    res.json(Object.fromEntries(status));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch providers status" });
  }
});

app.post('/api/gateway/chat', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const response = await gatewayRegistry.generate(req.body);
    res.json(response);
  } catch (error: any) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Health Check
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'healthy',
    database: 'PostgreSQL/Prisma',
    timestamp: new Date().toISOString()
  });
});

// Sentry Error Handler
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Global Error Handler to ensure JSON response instead of HTML
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred",
    path: req.path
  });
});

// Serve Frontend in Production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

export default app;
