import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface QwenResponse {
  intent: string;
  response: string;
  action?: Record<string, unknown>;
  confidence?: number;
}

@Injectable()
export class QwenService {
  private readonly logger = new Logger(QwenService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string | undefined;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>("QWEN_API_URL") ?? "https://api.qwen.ai/v1/chat/completions";
    this.apiKey = this.configService.get<string>("QWEN_API_KEY") ?? undefined;
    this.model = this.configService.get<string>("QWEN_MODEL") ?? "qwen3-8b";
    this.logger.log(`AI Service: ${this.apiUrl.includes("openrouter") ? "OpenRouter" : "Qwen Direct"} | Model: ${this.model} | Key: ${this.apiKey ? "configured" : "MISSING"}`);
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
  ): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number } }> {
    if (!this.apiKey) {
      this.logger.warn("QWEN_API_KEY não configurada. Retornando resposta de fallback.");
      return { content: JSON.stringify({ intent: "FALLBACK", response: "Desculpe, nosso assistente virtual está temporariamente indisponível. Por favor, entre em contato pelo telefone do estabelecimento." }) };
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      };

      // OpenRouter requires these headers for identification
      if (this.apiUrl.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = this.configService.get<string>("FRONTEND_URL") ?? "https://zenda.app";
        headers["X-Title"] = "Zenda";
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.model,
          messages,
          tools,
          temperature: 0.5,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Qwen API error ${response.status}: ${errorText}`);
        throw new Error(`Qwen API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? 0,
            completionTokens: data.usage.completion_tokens ?? 0,
          }
        : undefined;

      return { content, usage };
    } catch (error) {
      this.logger.error(`Erro ao chamar Qwen API`, error instanceof Error ? error.stack : String(error));
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