import { BaseProvider, RequestPayload, ResponseChunk, ProviderHealth, AIModel, GenerationConfig, SafetySetting } from "./abstract.provider";
import { Readable } from "stream";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GenericAIProvider extends BaseProvider {
  protected providerName: string;
  protected defaultModel: string;
  private baseUrl: string;
  private apiKey: string;
  private apiType: "openai" | "anthropic";

  constructor(providerName: string, defaultModel: string, apiType: "openai" | "anthropic", baseUrl: string, apiKey: string) {
    super();
    this.providerName = providerName;
    this.defaultModel = defaultModel;
    this.apiType = apiType;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  public async generate(payload: RequestPayload): Promise<ResponseChunk> {
    if (this.isCircuitOpen()) {
      throw new Error(`Provider ${this.providerName} is temporarily unavailable (circuit breaker open). Try again shortly.`);
    }

    try {
      let response: ResponseChunk;
      if (this.apiType === "anthropic") {
        response = await this.callAnthropicAPI(payload);
      } else {
        response = await this.callOpenAICompatibleAPI(payload);
      }
      this.recordSuccess();
      return response;
    } catch (e: any) {
      this.recordFailure();
      console.error(`[AI Gateway] Error in provider ${this.providerName} (${payload.model}): ${e.message}`);
      throw new Error(`${this.providerName} request failed: ${e.message}`);
    }
  }

  public async streamGenerate(payload: RequestPayload): AsyncIterable<ResponseChunk> {
    if (this.isCircuitOpen()) {
      throw new Error(`Provider ${this.providerName} is temporarily unavailable (circuit breaker open). Try again shortly.`);
    }

    try {
      let stream: AsyncIterable<ResponseChunk>;
      if (this.apiType === "anthropic") {
        stream = this.streamAnthropicAPI(payload);
      } else {
        stream = this.streamOpenAICompatibleAPI(payload);
      }
      this.recordSuccess();
      return stream;
    } catch (e: any) {
      this.recordFailure();
      console.error(`[AI Gateway] Stream Error in provider ${this.providerName}: ${e.message}`);
      throw new Error(`${this.providerName} streaming failed: ${e.message}`);
    }
  }

  public async getHealth(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return { status: "unhealthy", message: "API Key not configured", lastChecked: new Date() };
    }
    if (this.isCircuitOpen()) {
      return { status: "degraded", message: "Circuit breaker is open", lastChecked: new Date() };
    }
    // For generic providers, a simple check for API key presence is often sufficient
    // More robust health checks would involve a small API call
    return { status: "healthy", message: "Provider is operational", lastChecked: new Date() };
  }

  public async getModels(): Promise<AIModel[]> {
    // In a real-world scenario, this would fetch models from the provider's API
    // For now, we'll return models from our Prisma schema associated with this provider
    const models = await prisma.model.findMany({
      where: { provider: { name: this.providerName } },
    });

    if (models.length === 0) {
      // Fallback to a default model if no models are configured in DB
      return [{
        id: `${this.providerName}-${this.defaultModel}`,
        providerId: this.providerName,
        name: this.defaultModel,
        apiName: this.defaultModel,
        contextWindow: 4096,
        costPer1kInput: 0.0005,
        costPer1kOutput: 0.0015,
        isActive: true,
      }];
    }

    return models.map(model => ({
      id: model.id,
      providerId: this.providerName,
      name: model.name,
      apiName: model.apiName,
      contextWindow: model.contextWindow,
      costPer1kInput: model.costPer1kInput,
      costPer1kOutput: model.costPer1kOutput,
      isActive: model.isActive,
    }));
  }

  private async callOpenAICompatibleAPI(payload: RequestPayload): Promise<ResponseChunk> {
    const url = `${this.baseUrl}/chat/completions`;
    const body = this.formatOpenAIPayload(payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API returned status ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;

    return {
      text: content,
      usageMetadata: { promptTokenCount: promptTokens, candidatesTokenCount: completionTokens, totalTokenCount: promptTokens + completionTokens },
      finishReason: data.choices?.[0]?.finish_reason,
    };
  }

  private async *streamOpenAICompatibleAPI(payload: RequestPayload): AsyncIterable<ResponseChunk> {
    const url = `${this.baseUrl}/chat/completions`;
    const body = this.formatOpenAIPayload(payload);
    body.stream = true;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Streaming returned ${response.status}: ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available for response stream.");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;
        if (cleanLine === "data: [DONE]") continue;

        if (cleanLine.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(cleanLine.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || "";
            const finishReason = parsed.choices?.[0]?.finish_reason;

            yield {
              text: delta,
              finishReason: finishReason,
            };
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }
    }
  }

  private async callAnthropicAPI(payload: RequestPayload): Promise<ResponseChunk> {
    const url = `${this.baseUrl}/messages`;
    const anthropicPayload = this.formatAnthropicPayload(payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(anthropicPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic returned status ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";
    const promptTokens = data.usage?.input_tokens ?? 0;
    const completionTokens = data.usage?.output_tokens ?? 0;

    return {
      text: content,
      usageMetadata: { promptTokenCount: promptTokens, candidatesTokenCount: completionTokens, totalTokenCount: promptTokens + completionTokens },
      finishReason: data.stop_reason,
    };
  }

  private async *streamAnthropicAPI(payload: RequestPayload): AsyncIterable<ResponseChunk> {
    const url = `${this.baseUrl}/messages`;
    const anthropicPayload = this.formatAnthropicPayload(payload);
    anthropicPayload.stream = true;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(anthropicPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic Stream returned ${response.status}: ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available.");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        if (cleanLine.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(cleanLine.slice(6));
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              yield {
                text: parsed.delta.text,
              };
            } else if (parsed.type === "message_stop") {
              yield {
                finishReason: parsed.stop_reason,
              };
            }
          } catch (e) {
            console.error("Error parsing stream chunk:", e);
          }
        }
      }
    }
  }

  private formatOpenAIPayload(payload: RequestPayload): any {
    const messages = payload.messages.map(m => ({
      role: m.role === "system" ? "system" : m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const formattedPayload: any = {
      model: payload.model,
      messages,
      temperature: payload.generationConfig?.temperature ?? 0.7,
      max_tokens: payload.generationConfig?.maxOutputTokens ?? 2048,
    };

    if (payload.tools && payload.tools.length > 0) {
      formattedPayload.tools = payload.tools;
    }

    if (payload.responseFormat?.type === "json_object") {
      formattedPayload.response_format = { type: "json_object" };
    }

    return formattedPayload;
  }

  private formatAnthropicPayload(payload: RequestPayload): any {
    const systemMessage = payload.messages.find(m => m.role === "system");
    const userAndAssistantMessages = payload.messages.filter(m => m.role !== "system").map(m => ({
      role: m.role === "assistant" ? "assistant" as const : "user" as const,
      content: m.content,
    }));

    const formattedPayload: any = {
      model: payload.model,
      messages: userAndAssistantMessages.length > 0 ? userAndAssistantMessages : [{ role: "user", content: "Hello" }],
      max_tokens: payload.generationConfig?.maxOutputTokens ?? 2048,
      temperature: payload.generationConfig?.temperature ?? 0.7,
    };

    if (systemMessage) {
      formattedPayload.system = systemMessage.content;
    }

    return formattedPayload;
  }
}
