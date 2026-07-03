import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AIModel {
  id: string;
  providerId: string;
  name: string;
  apiName: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  isActive: boolean;
}

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

export interface SafetySetting {
  category: string;
  threshold: string;
}

export interface RequestPayload {
  model: string;
  messages: Array<{ role: string; content: string }>;
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
  stream?: boolean;
}

export interface ResponseChunk {
  text?: string;
  finishReason?: string;
  usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
}

export interface ProviderHealth {
  status: "healthy" | "unhealthy" | "degraded";
  message?: string;
  lastChecked: Date;
}

export abstract class BaseProvider {
  protected abstract providerName: string;
  protected abstract defaultModel: string;

  // Circuit Breaker State
  private static circuitState: Map<string, { isOpen: boolean; lastFailure: number; failureCount: number }> = new Map();
  private static readonly FAILURE_THRESHOLD = 5;
  private static readonly RESET_TIMEOUT = 60 * 1000; // 1 minute

  constructor() {
    if (!BaseProvider.circuitState.has(this.providerName)) {
      BaseProvider.circuitState.set(this.providerName, { isOpen: false, lastFailure: 0, failureCount: 0 });
    }
  }

  protected recordSuccess() {
    const state = BaseProvider.circuitState.get(this.providerName)!;
    state.failureCount = 0;
    state.isOpen = false;
  }

  protected recordFailure() {
    const state = BaseProvider.circuitState.get(this.providerName)!;
    state.failureCount++;
    state.lastFailure = Date.now();
    if (state.failureCount >= BaseProvider.FAILURE_THRESHOLD) {
      state.isOpen = true;
      console.warn(`Circuit breaker opened for ${this.providerName}`);
    }
  }

  protected isCircuitOpen(): boolean {
    const state = BaseProvider.circuitState.get(this.providerName)!;
    if (state.isOpen && (Date.now() - state.lastFailure > BaseProvider.RESET_TIMEOUT)) {
      // Attempt to close circuit after timeout
      state.isOpen = false;
      state.failureCount = 0;
      console.log(`Circuit breaker for ${this.providerName} reset.`);
    }
    return state.isOpen;
  }

  public abstract generate(payload: RequestPayload): Promise<ResponseChunk>;
  public abstract streamGenerate(payload: RequestPayload): AsyncIterable<ResponseChunk>;
  public abstract getHealth(): Promise<ProviderHealth>;
  public abstract getModels(): Promise<AIModel[]>;

  public async getModelCosts(modelName: string): Promise<{ inputCost: number; outputCost: number }> {
    const model = await prisma.model.findFirst({
      where: { name: modelName, provider: { name: this.providerName } },
    });
    if (model) {
      return { inputCost: model.costPer1kInput, outputCost: model.costPer1kOutput };
    }
    // Fallback to default if not found in DB
    return { inputCost: 0.0005, outputCost: 0.0015 };
  }

  public async calculateCost(modelName: string, promptTokens: number, completionTokens: number): Promise<number> {
    const { inputCost, outputCost } = await this.getModelCosts(modelName);
    return (promptTokens / 1000) * inputCost + (completionTokens / 1000) * outputCost;
  }
}
