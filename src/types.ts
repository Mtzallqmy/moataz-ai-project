export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

export interface UserPreference {
  id: string;
  userId: string;
  theme: "light" | "dark";
  defaultModel: string;
  systemPrompt: string | null;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE";
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  projectId: string;
  userId: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "system" | "user" | "assistant";
  content: string;
  tokenCount: number;
  cost: number;
  createdAt: string;
}

export interface Model {
  id: string;
  providerId: string;
  name: string;
  apiName: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  isActive: boolean;
}

export interface FileModel {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  userId: string;
  projectId: string;
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  description: string;
  category: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string;
  user?: { name: string; email: string };
}

export interface DailyStat {
  date: string;
  costUSD: number;
  tokens: number;
  requestsCount: number;
}

export interface ModelDistribution {
  modelName: string;
  requests: number;
  costUSD: number;
}

export interface AnalyticsData {
  summary: {
    totalCostUSD: number;
    totalTokens: number;
    totalRequests: number;
    avgLatencyMs: number;
  };
  dailyStats: DailyStat[];
  modelDistribution: ModelDistribution[];
}
