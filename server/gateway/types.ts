import { Readable } from "stream";

// Unified message roles
export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface GatewayMessage {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

// Universal Tool Calling types
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
}

export interface ToolOutput {
  toolCallId: string;
  output: string;
}

// Request parameters for the gateway
export interface GatewayRequest {
  model: string; // e.g. "gemini-3.5-flash", "gpt-4o", etc.
  messages: GatewayMessage[];
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  stream?: boolean;
  tools?: ToolDefinition[];
  responseFormat?: { type: "json_object" | "text" };
  routingPolicy?: "cost" | "latency" | "intelligence" | "balanced" | "weighted" | "failover";
}

// Detailed Token Usage breakdown
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  cachedTokens?: number;
  visionTokens?: number;
  audioTokens?: number;
  reasoningTokens?: number;
  totalTokens: number;
}

// Cost Breakdown
export interface CostMetrics {
  inputCostUSD: number;
  outputCostUSD: number;
  cachedCostUSD?: number;
  imageCostUSD?: number;
  audioCostUSD?: number;
  embeddingCostUSD?: number;
  totalCostUSD: number;
}

// Response parameters for complete generation
export interface GatewayResponse {
  content: string;
  usage: TokenUsage;
  cost: CostMetrics;
  modelUsed: string;
  providerUsed: string;
  durationMs: number;
  toolCalls?: ToolCall[];
}

// Chunk emitted during streaming
export interface GatewayStreamChunk {
  content: string;
  done: boolean;
  usage?: TokenUsage;
  cost?: CostMetrics;
  modelUsed?: string;
  providerUsed?: string;
  toolCalls?: ToolCall[];
}

// Provider Configuration details
export interface ProviderConfig {
  id: string;
  name: string;
  apiType: "gemini" | "openai" | "anthropic";
  baseUrl?: string;
  isActive: boolean;
  healthStatus: "healthy" | "degraded" | "offline";
  priority: number;
  weight: number;
  apiKeys: string[]; // Supports rotation & multiple keys
  currentKeyIndex: number;
}

// Interface for all providers configured in Moataz AI
export interface IAIProvider {
  id: string; // e.g. "prov-google"
  name: string; // e.g. "Google Gemini"
  apiType: "gemini" | "openai" | "anthropic";
  
  generateContent(request: GatewayRequest): Promise<GatewayResponse>;
  generateContentStream(request: GatewayRequest): Promise<Readable>;
  isHealthy(): Promise<boolean>;
  isConfigured(): boolean;
  getLatencyHistory(): number[];
  getFailureCount(): number;
  resetMetrics(): void;
}

// Interface for routing models intelligently based on policies
export interface IRoutingEngine {
  selectModel(request: GatewayRequest, policy: string): Promise<string>;
}

// Token Counter and Estimation Interface
export interface ITokenCounter {
  countTokens(text: string | GatewayMessage[]): number;
}

// Cost Calculator Interface
export interface ICostCalculator {
  calculateCost(modelId: string, inputTokens: number, outputTokens: number): number;
}

// Health Monitoring Interface for providers
export interface IHealthMonitor {
  checkHealth(providerId: string): Promise<"healthy" | "degraded" | "offline">;
}

// Model Discovery details
export interface IModelDiscovery {
  listAvailableModels(): Promise<any[]>;
  getModelDetails(modelId: string): Promise<any>;
}

// Telemetry Metrics for Observability
export interface ProviderMetrics {
  requestCount: number;
  successCount: number;
  failureCount: number;
  totalTokens: number;
  totalCostUSD: number;
  latencyMsHistory: number[];
  circuitBreakerTripped: boolean;
  lastFailureTime?: string;
}

