import { PrismaClient } from "@prisma/client";
import { BaseProvider, RequestPayload, ResponseChunk, ProviderHealth, AIModel } from "./abstract.provider.js";
import { GenericAIProvider } from "./generic.provider.js";

const prisma = new PrismaClient();

export class ProviderRegistry {
  private providers: Map<string, BaseProvider> = new Map();

  constructor() {
    // OpenAI Compatible Providers
    this.register(new GenericAIProvider("prov-openai", "gpt-4o", "openai", "https://api.openai.com/v1", process.env.OPENAI_API_KEY!));
    this.register(new GenericAIProvider("prov-anthropic", "claude-3-5-sonnet-20240620", "anthropic", "https://api.anthropic.com/v1", process.env.ANTHROPIC_API_KEY!));
    this.register(new GenericAIProvider("prov-groq", "llama-3.1-70b-versatile", "openai", "https://api.groq.com/openai/v1", process.env.GROQ_API_KEY!));
    this.register(new GenericAIProvider("prov-deepseek", "deepseek-chat", "openai", "https://api.deepseek.com/v1", process.env.DEEPSEEK_API_KEY!));
    this.register(new GenericAIProvider("prov-xai", "grok-beta", "openai", "https://api.x.ai/v1", process.env.XAI_API_KEY!));
    this.register(new GenericAIProvider("prov-mistral", "mistral-large-latest", "openai", "https://api.mistral.ai/v1", process.env.MISTRAL_API_KEY!));
    this.register(new GenericAIProvider("prov-openrouter", "auto", "openai", "https://openrouter.ai/api/v1", process.env.OPENROUTER_API_KEY!));
    this.register(new GenericAIProvider("prov-together", "togethercomputer/llama-2-70b-chat", "openai", "https://api.together.xyz/v1", process.env.TOGETHER_API_KEY!));
    this.register(new GenericAIProvider("prov-cohere", "command-r-plus", "openai", "https://api.cohere.com/v1", process.env.COHERE_API_KEY!));
    
    // 3. New Requested Providers
    this.register(new GenericAIProvider("prov-nvidia", "meta/llama-3.1-405b-instruct", "openai", "https://integrate.api.nvidia.com/v1", process.env.NVIDIA_API_KEY!));
    this.register(new GenericAIProvider("prov-huggingface", "meta-llama/Llama-3.1-70B-Instruct", "openai", "https://api-inference.huggingface.co/v1", process.env.HUGGINGFACE_API_KEY!));
    this.register(new GenericAIProvider("prov-perplexity", "llama-3.1-sonar-large-128k-online", "openai", "https://api.perplexity.ai", process.env.PERPLEXITY_API_KEY!));
    this.register(new GenericAIProvider("prov-fireworks", "accounts/fireworks/models/llama-v3p1-70b-instruct", "openai", "https://api.fireworks.ai/inference/v1", process.env.FIREWORKS_API_KEY!));
    
    // Local / Self-Hosted
    if (process.env.OLLAMA_API_URL) {
      this.register(new GenericAIProvider("prov-ollama", "llama3", "openai", process.env.OLLAMA_API_URL, "ollama"));
    }

    // Sync providers to DB
    this.syncProvidersToDB();
  }

  private async syncProvidersToDB() {
    try {
      for (const provider of this.providers.values()) {
        await prisma.provider.upsert({
          where: { name: provider.providerName as string },
          update: { apiType: provider.apiType || "generic", isActive: true },
          create: { name: provider.providerName as string, apiType: provider.apiType || "generic", isActive: true }
        });
      }
    } catch (error) {
      console.error("Failed to sync providers to DB:", error);
    }
  }

  public register(provider: BaseProvider) {
    this.providers.set(provider.providerName as string, provider);
  }

  public getProvider(providerName: string): BaseProvider | null {
    return this.providers.get(providerName) || null;
  }

  public async discoverModels(): Promise<AIModel[]> {
    const allModels: AIModel[] = [];
    for (const provider of this.providers.values()) {
      try {
        const models = await provider.getModels();
        allModels.push(...models);
      } catch (error) {
        console.error(`Failed to discover models for provider ${provider.providerName}:`, error);
      }
    }
    return allModels;
  }

  public async selectRoute(request: RequestPayload): Promise<{ provider: BaseProvider; modelName: string }> {
    const requestedModel = request.model;

    // Intelligent Routing & Failover
    for (const provider of this.providers.values()) {
      try {
        const health = await provider.getHealth();
        if (health.status === "healthy") {
          const models = await provider.getModels();
          const modelExists = models.some(m => m.name === requestedModel || m.apiName === requestedModel);
          if (modelExists) {
            return { provider, modelName: requestedModel };
          }
        }
      } catch (error) {
        console.warn(`Provider ${provider.providerName} is unhealthy or failed to respond:`, error);
      }
    }

    // Fallback to first healthy provider
    for (const provider of this.providers.values()) {
      try {
        const health = await provider.getHealth();
        if (health.status === "healthy") {
          const models = await provider.getModels();
          if (models.length > 0) {
            return { provider, modelName: models[0].name };
          }
        }
      } catch (error) { }
    }

    throw new Error("No healthy AI providers available or no suitable model found.");
  }

  public async generate(request: RequestPayload): Promise<ResponseChunk> {
    const { provider, modelName } = await this.selectRoute(request);
    return provider.generate({ ...request, model: modelName });
  }

  public streamGenerate(request: RequestPayload): AsyncIterable<ResponseChunk> {
    return (async function* () {
      try {
        const { provider, modelName } = await (this as ProviderRegistry).selectRoute(request);
        yield* provider.streamGenerate({ ...request, model: modelName });
      } catch (error) {
        throw error;
      }
    }).call(this);
  }

  public async getProvidersStatus(): Promise<Map<string, ProviderHealth>> {
    const statusMap = new Map<string, ProviderHealth>();
    for (const provider of this.providers.values()) {
      try {
        const health = await provider.getHealth();
        statusMap.set(provider.providerName as string, health);
        
        await prisma.provider.update({
          where: { name: provider.providerName as string },
          data: { healthStatus: health.status }
        });
      } catch (error) {
        statusMap.set(provider.providerName as string, { status: "unhealthy", message: String(error), lastChecked: new Date() });
      }
    }
    return statusMap;
  }
}

export const gatewayRegistry = new ProviderRegistry();
