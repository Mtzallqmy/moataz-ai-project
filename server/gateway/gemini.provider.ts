import { BaseProvider } from "./abstract.provider.js";
import { GatewayRequest, GatewayResponse, TokenUsage, CostMetrics } from "./types.js";
import { GoogleGenAI } from "@google/genai";
import { Readable } from "stream";
import { db } from "../db/engine.js";

export class GeminiProvider extends BaseProvider {
  id = "prov-google";
  name = "Google Gemini";
  apiType: "gemini" = "gemini";

  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = this.getApiKey("GEMINI_API_KEY", this.id);
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        throw new Error(
          "GEMINI_API_KEY is not configured in environment variables or user secrets. Please set it in the Settings panel."
        );
      }
      this.client = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return this.client;
  }

  // Generate complete text content
  async generateContent(request: GatewayRequest): Promise<GatewayResponse> {
    const start = Date.now();
    const modelInDb = db.getModels().find((m) => m.apiName === request.model);
    const costIn = modelInDb?.costPer1kInput ?? 0.000075;
    const costOut = modelInDb?.costPer1kOutput ?? 0.0003;

    // Validate provider availability before making a live call
    const provider = db.getProviders().find((p) => p.id === this.id);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${this.name} is disabled. Enable it in the Admin panel.`);
    }
    if (!this.isConfigured()) {
      throw new Error(`Provider ${this.name} is not configured: missing GEMINI_API_KEY. Set it in environment variables or the Settings panel.`);
    }
    if (this.isCircuitTripped()) {
      throw new Error(`Provider ${this.name} is temporarily unavailable (circuit breaker open). Try again shortly.`);
    }
    if (request.model.startsWith("gpt-") || request.model.startsWith("claude-")) {
      throw new Error(`Model "${request.model}" is not a Google Gemini model and cannot be served by ${this.name}.`);
    }

    try {
      const ai = this.getClient();
      
      const systemMsg = request.messages.find((m) => m.role === "system");
      const userAndAssistantMsgs = request.messages.filter((m) => m.role !== "system");

      const promptText = userAndAssistantMsgs.length > 0
        ? userAndAssistantMsgs[userAndAssistantMsgs.length - 1].content
        : "Hello";

      const systemPrompt = systemMsg?.content || request.systemInstruction;

      const response = await ai.models.generateContent({
        model: request.model,
        contents: promptText,
        config: {
          systemInstruction: systemPrompt,
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2048,
        },
      });

      const responseText = response.text || "";
      const inputTokens = this.estimateTokens(request.messages);
      const outputTokens = this.estimateTokens(responseText);
      const costUSD = this.calculateEstimatedCost(inputTokens, outputTokens, costIn, costOut);
      const duration = Date.now() - start;

      const usage: TokenUsage = {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      };

      const cost: CostMetrics = {
        inputCostUSD: (inputTokens / 1000) * costIn,
        outputCostUSD: (outputTokens / 1000) * costOut,
        totalCostUSD: costUSD,
      };

      this.recordMetrics(duration, true, usage.totalTokens, cost.totalCostUSD);

      return {
        content: responseText,
        usage,
        cost,
        modelUsed: request.model,
        providerUsed: this.name,
        durationMs: duration,
      };
    } catch (e: any) {
      console.error(`Gemini generation error: ${e.message}`);
      this.recordMetrics(Date.now() - start, false);
      throw new Error(`${this.name} request failed: ${e.message}`);
    }
  }

  // Generate streaming text content
  async generateContentStream(request: GatewayRequest): Promise<Readable> {
    const stream = new Readable({
      read() {},
    });

    const modelInDb = db.getModels().find((m) => m.apiName === request.model);
    const costIn = modelInDb?.costPer1kInput ?? 0.000075;
    const costOut = modelInDb?.costPer1kOutput ?? 0.0003;

    // Emit structured errors for unconfigured/unavailable states instead of simulating
    if (!this.isConfigured()) {
      this.pushStreamError(stream, `Provider ${this.name} is not configured: missing GEMINI_API_KEY. Set it in environment variables or the Settings panel.`);
      return stream;
    }
    if (this.isCircuitTripped()) {
      this.pushStreamError(stream, `Provider ${this.name} is temporarily unavailable (circuit breaker open). Try again shortly.`);
      return stream;
    }
    if (request.model.startsWith("gpt-") || request.model.startsWith("claude-")) {
      this.pushStreamError(stream, `Model "${request.model}" is not a Google Gemini model and cannot be served by ${this.name}.`);
      return stream;
    }

    try {
      const ai = this.getClient();
      const systemMsg = request.messages.find((m) => m.role === "system");
      const userAndAssistantMsgs = request.messages.filter((m) => m.role !== "system");
      const promptText = userAndAssistantMsgs.length > 0
        ? userAndAssistantMsgs[userAndAssistantMsgs.length - 1].content
        : "Hello";

      const systemPrompt = systemMsg?.content || request.systemInstruction;
      const startMs = Date.now();

      // Start asynchronous generator stream
      (async () => {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: request.model,
            contents: promptText,
            config: {
              systemInstruction: systemPrompt,
              temperature: request.temperature ?? 0.7,
              maxOutputTokens: request.maxTokens ?? 2048,
            },
          });

          let fullResponseText = "";
          for await (const chunk of responseStream) {
            const chunkText = chunk.text || "";
            fullResponseText += chunkText;
            
            stream.push(
              JSON.stringify({
                content: chunkText,
                done: false,
              }) + "\n"
            );
          }

          const inputTokens = this.estimateTokens(request.messages);
          const outputTokens = this.estimateTokens(fullResponseText);
          const costUSD = this.calculateEstimatedCost(inputTokens, outputTokens, costIn, costOut);

          stream.push(
            JSON.stringify({
              content: "",
              done: true,
              usage: {
                promptTokens: inputTokens,
                completionTokens: outputTokens,
                totalTokens: inputTokens + outputTokens,
              },
              cost: {
                inputCostUSD: (inputTokens / 1000) * costIn,
                outputCostUSD: (outputTokens / 1000) * costOut,
                totalCostUSD: costUSD,
              },
              modelUsed: request.model,
              providerUsed: this.name,
            }) + "\n"
          );
          stream.push(null);
          this.recordMetrics(Date.now() - startMs, true, inputTokens + outputTokens, costUSD);
        } catch (err: any) {
          console.error("Error in Gemini live stream generator:", err);
          this.recordMetrics(100, false);
          this.pushStreamError(stream, `${this.name} streaming failed: ${err.message}`);
        }
      })();

      return stream;
    } catch (e: any) {
      console.error(`Stream initial setup failed: ${e.message}`);
      this.recordMetrics(100, false);
      this.pushStreamError(stream, `${this.name} streaming failed: ${e.message}`);
      return stream;
    }
  }

  // Health check verifies client load success
  async isHealthy(): Promise<boolean> {
    try {
      this.getClient();
      return !this.isCircuitTripped();
    } catch (e) {
      return false;
    }
  }

  // Whether a valid Gemini API key is configured
  isConfigured(): boolean {
    const apiKey = this.getApiKey("GEMINI_API_KEY", this.id);
    return !!apiKey && apiKey !== "MY_GEMINI_API_KEY";
  }
}
