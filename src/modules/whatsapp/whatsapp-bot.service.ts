import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { WhatsappService } from "../../infrastructure/notifications/whatsapp.service";
import { QwenService, ChatMessage, AiProviderConfig } from "../../infrastructure/ai/qwen.service";
import { GeminiService } from "../../infrastructure/ai/gemini.service";
import { ChatSessionService } from "./chat-session.service";
import { IntentProcessorService } from "./intent-processor.service";

const SYSTEM_PROMPT_TEMPLATE = `Você é Zenda, uma assistente virtual super simpática e acolhedora de um estabelecimento de beleza (barbearia/salão). Você fala como uma amiga próxima — casual, prestativa, com emojis, e sempre de forma humana e natural.

ESTILO DE COMUNICAÇÃO:
- Fale em português brasileiro, de forma super casual e amigável
- Use emojis (✨, 💇‍♂️, 📅, ⏰, ✅) para deixar a conversa mais leve
- Seja calorosa e acolhedora — cumprimente o cliente, use "Oi!", "Claro!", "Com certeza!"
- Use no máximo 3-4 frases, mas seja completa nas informações
- Sempre confirme antes de agendar ou cancelar algo
- Se o cliente perguntar sobre serviços, liste TODOS com preços e duração de forma organizada
- Se o cliente perguntar sobre agendamentos, mostre TODOS os próximos agendamentos dele
- Use a data atual como referência: {currentDate}

REGRAS IMPORTANTES:
- Sempre peça confirmação antes de executar ações de agendamento ou cancelamento
- Se não souber ou não conseguir ajudar, use intent "FALLBACK"
- Para agendar, você precisa: serviço, data (YYYY-MM-DD), horário, nome do cliente
- NUNCA invente preços ou serviços que não estão na lista abaixo

SERVIÇOS DISPONÍVEIS:
{services}

{appointmentsContext}

FORMATO DE RESPOSTA (apenas JSON, sem markdown):
{
  "intent": "BOOK|CANCEL|QUERY_SERVICES|QUERY_SLOTS|QUERY_APPOINTMENTS|FALLBACK",
  "response": "mensagem amigável e completa para o cliente, com emojis e informações claras",
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
  private readonly aiProvider: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly qwenService: QwenService,
    private readonly geminiService: GeminiService,
    private readonly chatSessionService: ChatSessionService,
    private readonly intentProcessor: IntentProcessorService,
  ) {
    this.aiProvider = this.configService.get<string>("AI_PROVIDER") ?? "qwen";
    this.logger.log(`AI Provider configurado: ${this.aiProvider}`);
  }

  async processIncomingMessage(phone: string, text: string): Promise<void> {
    const result = await this.generateResponse(phone, text);

    // Enviar resposta pelo WhatsApp
    await this.whatsappService.sendMessage("default", result.cleanPhone, result.finalResponse);

    // Salvar contexto e log
    await this.chatSessionService.updateContext(result.sessionId, text, result.finalResponse);
    await this.chatSessionService.saveLog(
      result.sessionId,
      text,
      result.finalResponse,
      result.intent,
      result.confidence,
      {
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        action: result.action ?? null,
      },
    );
  }

  async processTestMessage(phone: string, text: string, testContext?: {
    services?: string;
    appointments?: string;
    currentDate?: string;
  }): Promise<{
    response: string;
    intent: string;
    confidence: number;
    model: string;
  }> {
    const result = await this.generateResponse(phone, text, testContext);

    // Salvar contexto e log (sem enviar WhatsApp)
    await this.chatSessionService.updateContext(result.sessionId, text, result.finalResponse);
    await this.chatSessionService.saveLog(
      result.sessionId,
      text,
      result.finalResponse,
      result.intent,
      result.confidence,
      {
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        action: result.action ?? null,
      },
    );

    return {
      response: result.finalResponse,
      intent: result.intent,
      confidence: result.confidence,
      model: result.model,
    };
  }

  private async generateResponse(phone: string, text: string, testContext?: {
    services?: string;
    appointments?: string;
    currentDate?: string;
  }): Promise<{
    cleanPhone: string;
    sessionId: string;
    finalResponse: string;
    intent: string;
    confidence: number;
    model: string;
    promptTokens: number;
    completionTokens: number;
    action?: Record<string, unknown>;
  }> {
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
        businessId = client.businessId ?? undefined;
        await this.chatSessionService.updateState(session.id, session.state, clientId, businessId);
      }
    }

    // 3. Se ainda não temos businessId (cliente novo), tentar usar o primeiro estabelecimento disponível
    if (!businessId) {
      const defaultBusiness = await this.getDefaultBusiness();
      if (defaultBusiness) {
        businessId = defaultBusiness.id;
        await this.chatSessionService.updateState(session.id, session.state, clientId, businessId);
      }
    }

    // 4. Buscar dados do estabelecimento e agendamentos do cliente para o prompt
    // Se testContext é fornecido, usar os dados do contexto em vez de buscar no banco
    let businessData: { name: string; slug: string; services: string } | null = null;
    let appointmentsContext: string | null = null;

    if (testContext?.services) {
      businessData = { name: 'Seu Negócio', slug: '', services: testContext.services };
    } else {
      businessData = businessId ? await this.getBusinessData(businessId) : null;
    }

    if (testContext?.appointments) {
      appointmentsContext = `AGENDAMENTOS DO CLIENTE:\n${testContext.appointments}`;
    } else {
      appointmentsContext = clientId ? await this.getClientAppointmentsContext(clientId) : null;
    }

    // 4.5. Buscar prompt customizado do dono do negócio e config de IA
    let ownerId: string | undefined;
    if (businessId) {
      const businessWithOwner = await this.prisma.business.findUnique({
        where: { id: businessId },
        include: { staff: { where: { role: 'OWNER' }, select: { id: true } } },
      });
      ownerId = businessWithOwner?.staff[0]?.id;
    }
    const customPrompt = await this.getCustomPrompt(businessId);
    const aiConfig = await this.getUserAiConfig(businessId);

    // 5. Montar mensagens para a IA
    const contextMessages = this.chatSessionService.getContextMessages(session);
    const messages = this.buildMessages(text, contextMessages, businessData, appointmentsContext, customPrompt, testContext?.currentDate);

    // 5. Chamar IA (Gemini first, fallback to OpenRouter)
    let aiResponse: { content: string; usage?: { promptTokens: number; completionTokens: number } };
    let parsed: { intent: string; response: string; action?: Record<string, unknown>; confidence?: number };
    let usedProvider = aiConfig?.provider ?? this.aiProvider;

    try {
      if (usedProvider === "gemini") {
        this.logger.debug("[Bot] Usando Gemini AI");
        aiResponse = await this.geminiService.chat(messages, aiConfig?.gemini);
      } else {
        this.logger.debug("[Bot] Usando OpenRouter AI");
        aiResponse = await this.qwenService.chat(messages, undefined, aiConfig?.openrouter);
      }

      if (usedProvider === "gemini") {
        parsed = this.geminiService.parseResponse(aiResponse.content);
      } else {
        parsed = this.qwenService.parseResponse(aiResponse.content);
      }
    } catch (error) {
      this.logger.warn(`[Bot] ${usedProvider} falhou, tentando fallback...`, error instanceof Error ? error.message : String(error));

      // Fallback: if Gemini fails, try OpenRouter
      if (usedProvider === "gemini") {
        try {
          this.logger.debug("[Bot] Fallback para OpenRouter");
          aiResponse = await this.qwenService.chat(messages, undefined, aiConfig?.openrouter);
          parsed = this.qwenService.parseResponse(aiResponse.content);
          usedProvider = "openrouter";
        } catch (fallbackError) {
          this.logger.error(`[Bot] OpenRouter fallback também falhou`, fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
          aiResponse = { content: "", usage: { promptTokens: 0, completionTokens: 0 } };
          parsed = {
            intent: "FALLBACK",
            response: "Desculpe, nosso assistente está com dificuldades técnicas no momento. Pode tentar novamente em alguns instantes?",
          };
        }
      } else {
        aiResponse = { content: "", usage: { promptTokens: 0, completionTokens: 0 } };
        parsed = {
          intent: "FALLBACK",
          response: "Desculpe, nosso assistente está com dificuldades técnicas no momento. Pode tentar novamente em alguns instantes?",
        };
      }
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

    const model = usedProvider === "gemini" ? "gemini-2.0-flash" : usedProvider === "openrouter" ? "openrouter-free" : "qwen3-8b";

    return {
      cleanPhone,
      sessionId: session.id,
      finalResponse,
      intent: parsed.intent,
      confidence,
      model,
      promptTokens: aiResponse?.usage?.promptTokens ?? 0,
      completionTokens: aiResponse?.usage?.completionTokens ?? 0,
      action: parsed.action,
    };
  }

  private async findClientByPhone(phone: string) {
    // Tentar match exato e depois parcial
    const clients = await this.prisma.client.findMany({
      where: {
        phone: {
          contains: phone.slice(-11), // últimos 11 dígitos
        },
      },
      include: { business: true },
      take: 1,
    });
    return clients[0] ?? null;
  }

  private async getDefaultBusiness() {
    const business = await this.prisma.business.findFirst({
      orderBy: { createdAt: "asc" },
    });
    return business;
  }

  private async getClientAppointmentsContext(clientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        clientId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
      take: 10,
      include: { service: true, professional: true },
    });

    if (appointments.length === 0) {
      return null;
    }

    const list = appointments
      .map((a) => `• ${a.service?.name ?? "Serviço"} — ${a.date.toLocaleDateString("pt-BR")} às ${a.startTime} (${a.professional.name})`)
      .join("\n");

    return `AGENDAMENTOS DO CLIENTE:\n${list}`;
  }

  private async getBusinessData(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { services: true, schedules: true },
    });

    if (!business) return null;

    const servicesText = business.services
      .map((s) => `- ${s.name}: R$${s.price.toFixed(2)} (${s.duration}min) [id:${s.id}]`)
      .join("\n");

    return {
      name: business.name,
      slug: business.slug,
      services: servicesText,
    };
  }

  private async getCustomPrompt(businessId: string | undefined) {
    if (!businessId) return null;
    const settings = await this.prisma.siteSettings.findUnique({
      where: { businessId },
    });
    if (!settings?.botEnabled) return null;
    return settings.botPrompt ?? null;
  }

  private async getUserAiConfig(businessId: string | undefined): Promise<{
    provider: string;
    openrouter?: AiProviderConfig;
    gemini?: AiProviderConfig;
  } | null> {
    if (!businessId) return null;
    const settings = await this.prisma.siteSettings.findUnique({
      where: { businessId },
    });
    if (!settings) return null;

    // If using default provider, return null to use global config
    if (settings.aiProvider === "default" || !settings.aiProvider) return null;

    const result: { provider: string; openrouter?: AiProviderConfig; gemini?: AiProviderConfig } = {
      provider: settings.aiProvider,
    };

    // OpenRouter config
    if (settings.aiApiKey && (settings.aiProvider === "openrouter" || settings.aiProvider === "qwen")) {
      result.openrouter = {
        apiKey: settings.aiApiKey,
        model: settings.aiModel ?? "meta-llama/llama-3.3-70b-instruct:free",
      };
    }

    // Gemini config - user would need to provide their own Gemini key
    // For now, if they set a custom key, we assume it's for their chosen provider
    if (settings.aiProvider === "gemini" && settings.aiApiKey) {
      result.gemini = {
        apiKey: settings.aiApiKey,
        model: settings.aiModel ?? "gemini-2.0-flash",
        apiUrl: "https://generativelanguage.googleapis.com/v1beta/models",
      };
    }

    return result;
  }

  private buildMessages(
    userText: string,
    context: { role: "user" | "assistant"; content: string }[],
    businessData: { name: string; slug: string; services: string } | null,
    appointmentsContext: string | null,
    customPrompt: string | null,
    overrideDate?: string,
  ): ChatMessage[] {
    const currentDate = overrideDate ?? new Date().toLocaleDateString("pt-BR");

    const basePrompt = customPrompt ?? SYSTEM_PROMPT_TEMPLATE;

    const systemPrompt = basePrompt
      .replace("{currentDate}", currentDate)
      .replace("{services}", businessData?.services ?? "Não disponível")
      .replace("{appointmentsContext}", appointmentsContext ?? "AGENDAMENTOS DO CLIENTE: Nenhum agendamento futuro encontrado.");

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