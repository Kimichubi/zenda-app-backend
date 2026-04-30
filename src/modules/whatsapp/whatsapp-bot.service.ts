import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { WhatsappService } from "../../infrastructure/notifications/whatsapp.service";
import { QwenService, ChatMessage } from "../../infrastructure/ai/qwen.service";
import { ChatSessionService } from "./chat-session.service";
import { IntentProcessorService } from "./intent-processor.service";

const SYSTEM_PROMPT_TEMPLATE = `Você é Zenda, assistente virtual de um estabelecimento de beleza (barbearia/salão).
Seu objetivo é ajudar clientes a agendar, consultar ou cancelar atendimentos de forma natural, amigável e breve.

REGRAS:
- Responda em português brasileiro, de forma casual e amigável
- Use no máximo 2-3 frases curtas
- Sempre peça confirmação antes de executar ações de agendamento ou cancelamento
- Se não souber ou não conseguir ajudar, use intent "FALLBACK"
- Para agendar, você precisa: serviço, data (YYYY-MM-DD), horário, nome do cliente
- Use a data atual como referência: {currentDate}

FUNCIONÁRIOS E SERVIÇOS DISPONÍVEIS:
{services}

FORMATO DE RESPOSTA (apenas JSON, sem markdown):
{
  "intent": "BOOK|CANCEL|QUERY_SERVICES|QUERY_SLOTS|QUERY_APPOINTMENTS|FALLBACK",
  "response": "mensagem amigável para o cliente",
  "confidence": 0.95,
  "action": {
    // dados necessários para a ação, ex:
    // "slug": "barbearia-x",
    // "serviceId": "uuid",
    // "date": "2024-01-15",
    // "startTime": "14:00",
    // "clientName": "João",
    // "clientPhone": "11999999999"
  }
}`;

@Injectable()
export class WhatsappBotService {
  private readonly logger = new Logger(WhatsappBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly qwenService: QwenService,
    private readonly chatSessionService: ChatSessionService,
    private readonly intentProcessor: IntentProcessorService,
  ) {}

  async processIncomingMessage(phone: string, text: string): Promise<void> {
    const cleanPhone = this.cleanPhone(phone);
    this.logger.log(`[Bot] Mensagem de ${cleanPhone}: ${text.slice(0, 100)}`);

    // 1. Buscar/criar sessão
    const session = await this.chatSessionService.findOrCreateSession(cleanPhone);

    // 2. Tentar identificar cliente pelo telefone
    let clientId = session.clientId ?? undefined;
    let businessId = session.businessId ?? undefined;

    if (!clientId) {
      const client = await this.findClientByPhone(cleanPhone);
      if (client) {
        clientId = client.id;
        businessId = client.user.businessId ?? undefined;
        await this.chatSessionService.updateState(session.id, session.state, clientId, businessId);
      }
    }

    // 3. Buscar dados do estabelecimento para o prompt
    const businessData = businessId ? await this.getBusinessData(businessId) : null;

    // 4. Montar mensagens para a IA
    const contextMessages = this.chatSessionService.getContextMessages(session);
    const messages = this.buildMessages(text, contextMessages, businessData);

    // 5. Chamar IA
    let aiResponse: { content: string; usage?: { promptTokens: number; completionTokens: number } };
    let parsed: { intent: string; response: string; action?: Record<string, unknown>; confidence?: number };

    try {
      aiResponse = await this.qwenService.chat(messages);
      parsed = this.qwenService.parseResponse(aiResponse.content);
    } catch (error) {
      this.logger.error(`[Bot] Erro na IA, usando fallback`, error instanceof Error ? error.stack : String(error));
      aiResponse = { content: "", usage: { promptTokens: 0, completionTokens: 0 } };
      parsed = {
        intent: "FALLBACK",
        response: "Desculpe, nosso assistente está com dificuldades técnicas no momento. Pode tentar novamente em alguns instantes?",
      };
    }

    // 6. Se confidence baixa ou fallback, apenas responder (não executar ação)
    const confidence = parsed.confidence ?? 0;
    let finalResponse = parsed.response;

    if (parsed.intent !== "FALLBACK" && confidence >= 0.5) {
      // 7. Executar ação
      const result = await this.intentProcessor.process(
        parsed.intent,
        parsed.action,
        businessId,
        clientId,
      );

      if (result.message) {
        finalResponse = result.message;
      }
    }

    // 8. Enviar resposta pelo WhatsApp
    await this.whatsappService.sendMessage("default", cleanPhone, finalResponse);

    // 9. Salvar contexto e log
    await this.chatSessionService.updateContext(session.id, text, finalResponse);
    await this.chatSessionService.saveLog(
      session.id,
      text,
      finalResponse,
      parsed.intent,
      confidence,
      {
        model: "qwen3-8b",
        promptTokens: aiResponse?.usage?.promptTokens ?? 0,
        completionTokens: aiResponse?.usage?.completionTokens ?? 0,
        action: parsed.action ?? null,
      },
    );
  }

  private async findClientByPhone(phone: string) {
    // Tentar match exato e depois parcial
    const clients = await this.prisma.client.findMany({
      where: {
        phone: {
          contains: phone.slice(-11), // últimos 11 dígitos
        },
      },
      include: { user: true },
      take: 1,
    });
    return clients[0] ?? null;
  }

  private async getBusinessData(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: {
          include: {
            services: true,
            schedules: true,
          },
        },
      },
    });

    if (!business) return null;

    const servicesText = business.owner.services
      .map((s) => `- ${s.name}: R$${s.price.toFixed(2)} (${s.duration}min) [id:${s.id}]`)
      .join("\n");

    return {
      name: business.name,
      slug: business.slug,
      services: servicesText,
    };
  }

  private buildMessages(
    userText: string,
    context: { role: "user" | "assistant"; content: string }[],
    businessData: { name: string; slug: string; services: string } | null,
  ): ChatMessage[] {
    const currentDate = new Date().toLocaleDateString("pt-BR");

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE
      .replace("{currentDate}", currentDate)
      .replace("{services}", businessData?.services ?? "Não disponível");

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    // Adicionar contexto recente
    for (const msg of context) {
      messages.push({ role: msg.role, content: msg.content });
    }

    messages.push({ role: "user", content: userText });

    return messages;
  }

  private cleanPhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (!cleaned.startsWith("55") && cleaned.length >= 10) {
      cleaned = "55" + cleaned;
    }
    return cleaned;
  }
}