import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

export interface ChatContextMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const MAX_CONTEXT_MESSAGES = 10;

@Injectable()
export class ChatSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateSession(phoneNumber: string) {
    let session = await this.prisma.chatSession.findUnique({
      where: { phoneNumber },
    });

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: { phoneNumber },
      });
    }

    return session;
  }

  async updateContext(
    sessionId: string,
    userMessage: string,
    assistantMessage: string,
  ) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    const context: ChatContextMessage[] = ((session?.context as unknown) as ChatContextMessage[]) ?? [];

    context.push(
      { role: "user", content: userMessage, timestamp: new Date().toISOString() },
      { role: "assistant", content: assistantMessage, timestamp: new Date().toISOString() },
    );

    // Manter apenas as últimas 10 mensagens
    const trimmed = context.slice(-MAX_CONTEXT_MESSAGES);

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        context: trimmed as any,
        lastMessageAt: new Date(),
      },
    });

    return trimmed;
  }

  async updateState(sessionId: string, state: string, clientId?: string, businessId?: string) {
    const data: Record<string, any> = { state };
    if (clientId) data.clientId = clientId;
    if (businessId) data.businessId = businessId;

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data,
    });
  }

  async saveLog(
    sessionId: string,
    incoming: string,
    outgoing: string,
    intent: string,
    confidence: number,
    metadata: Record<string, unknown>,
  ) {
    await this.prisma.chatLog.create({
      data: {
        sessionId,
        incoming,
        outgoing,
        intent,
        confidence,
        metadata: metadata as any,
      },
    });
  }

  getContextMessages(session: { context: any }): ChatContextMessage[] {
    return (session.context as ChatContextMessage[]) ?? [];
  }
}