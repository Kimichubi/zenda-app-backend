import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatMessage, QwenResponse } from "./qwen.service";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("GEMINAI_API_KEY") ?? undefined;
    this.model = this.configService.get<string>("GEMINAI_MODEL") ?? "gemini-2.0-flash";
    this.logger.log(`AI Service: Google Gemini | Model: ${this.model} | Key: ${this.apiKey ? "configured" : "MISSING"}`);
  }

  async chat(
    messages: ChatMessage[],
  ): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number } }> {
    if (!this.apiKey) {
      this.logger.warn("GEMINAI_API_KEY não configurada. Retornando resposta de fallback.");
      return {
        content: JSON.stringify({
          intent: "FALLBACK",
          response: "Desculpe, nosso assistente virtual está temporariamente indisponível. Por favor, entre em contato pelo telefone do estabelecimento.",
        }),
      };
    }

    try {
      // Separate system prompt from conversation
      const systemPrompt = messages.find((m) => m.role === "system")?.content ?? "";
      const conversation = messages.filter((m) => m.role !== "system");

      const contents = conversation.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const body: any = {
        contents,
        generationConfig: {
          temperature: 0.5,
          responseMimeType: "application/json",
        },
      };

      if (systemPrompt) {
        body.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Gemini API error ${response.status}: ${errorText}`);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const usage = data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount ?? 0,
            completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
          }
        : undefined;

      return { content, usage };
    } catch (error) {
      this.logger.error(`Erro ao chamar Gemini API`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  parseResponse(content: string): QwenResponse {
    try {
      const parsed = JSON.parse(content);
      return {
        intent: parsed.intent ?? "FALLBACK",
        response: parsed.response ?? "Desculpe, não entendi. Pode reformular?",
        action: parsed.action,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
      };
    } catch {
      return {
        intent: "FALLBACK",
        response: content.slice(0, 500),
      };
    }
  }
}
