import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

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

export interface AiProviderConfig {
  apiKey: string;
  model: string;
  apiUrl?: string;
}

@Injectable()
export class QwenService {
  private readonly logger = new Logger(QwenService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly fallbackModels = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "baidu/cobuddy:free",
    "google/gemma-4-26b-a4b-it:free",
    "qwen/qwen3-coder:free",
    "openai/gpt-oss-20b:free",
  ];

  constructor(private readonly configService: ConfigService) {
    // Support both old QWEN_* and new OPENROUTER_* env vars
    this.apiUrl = this.configService.get<string>("OPENROUTER_API_URL")
      ?? this.configService.get<string>("QWEN_API_URL")
      ?? "https://openrouter.ai/api/v1/chat/completions";
    this.apiKey = (this.configService.get<string>("OPENROUTER_API_KEY")
      ?? this.configService.get<string>("QWEN_API_KEY")
      ?? "").trim();
    this.model = this.configService.get<string>("OPENROUTER_MODEL")
      ?? this.configService.get<string>("QWEN_MODEL")
      ?? "meta-llama/llama-3.3-70b-instruct:free";
    this.logger.log(`AI Service: OpenRouter | Model: ${this.model} | Key: ${this.apiKey ? "configured (" + this.apiKey.slice(0, 8) + "...)" : "MISSING"}`);
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    customConfig?: AiProviderConfig,
  ): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number } }> {
    const apiKey = customConfig?.apiKey ?? this.apiKey;
    const model = customConfig?.model ?? this.model;
    const apiUrl = customConfig?.apiUrl ?? this.apiUrl;

    if (!apiKey) {
      this.logger.warn("API key não configurada. Retornando resposta de fallback.");
      return { content: JSON.stringify({ intent: "FALLBACK", response: "Desculpe, nosso assistente virtual está temporariamente indisponível. Por favor, entre em contato pelo telefone do estabelecimento." }) };
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };

      // OpenRouter requires these headers for identification
      if (apiUrl.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = this.configService.get<string>("FRONTEND_URL") ?? "https://zenda.app";
        headers["X-Title"] = "Zenda";
      }

      const modelsToTry = [model, ...this.fallbackModels.filter((m) => m !== model)];

      for (const tryModel of modelsToTry) {
        try {
          this.logger.debug(`Enviando requisição para ${apiUrl} com model=${tryModel}`);

          const response = await axios.post(
            apiUrl,
            {
              model: tryModel,
              messages,
              tools,
              temperature: 0.5,
              response_format: { type: "json_object" },
            },
            { headers },
          );

          const data = response.data;
          const content = data.choices?.[0]?.message?.content ?? "";
          const usage = data.usage
            ? {
                promptTokens: data.usage.prompt_tokens ?? 0,
                completionTokens: data.usage.completion_tokens ?? 0,
              }
            : undefined;

          return { content, usage };
        } catch (attemptError: any) {
          const status = attemptError.response?.status;
          const errorText = attemptError.response?.data ? JSON.stringify(attemptError.response.data) : attemptError.message;

          if (status === 404 || status === 429) {
            this.logger.warn(`Modelo ${tryModel} não disponível (status ${status}), tentando próximo...`);
            continue;
          }

          this.logger.error(`API error ${status} com ${tryModel}: ${errorText}`);
          throw new Error(`API error: ${status}`);
        }
      }

      throw new Error("Nenhum modelo disponível");
    } catch (error: any) {
      this.logger.error(`Erro ao chamar API`, error instanceof Error ? error.stack : String(error));
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