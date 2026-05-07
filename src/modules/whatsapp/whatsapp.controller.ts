import { Controller, Get, Post, Delete, UseGuards, Request, Logger, Param, Query } from '@nestjs/common';
import { WhatsappService } from '../../infrastructure/notifications/whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('WhatsappController initialized');
  }

  @Get('status')
  async getStatus(@Request() req) {
    const status = await this.whatsappService.getSessionStatus(req.user.id);
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { businessId: true },
    });
    if (user?.businessId) {
      await this.prisma.business.update({
        where: { id: user.businessId },
        data: { whatsappStatus: status },
      });
    }
    return { status };
  }

  @Post('connect')
  async connect(@Request() req) {
    this.logger.log(`Starting connection for user ${req.user.id}`);
    return this.whatsappService.startSession(req.user.id);
  }

  @Get('qr')
  async getQR(@Request() req) {
    const qr = await this.whatsappService.getQRCode(req.user.id);
    return { qr };
  }

  @Delete('logout')
  async logout(@Request() req) {
    const result = await this.whatsappService.logoutSession(req.user.id);
    if (result.success) {
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { businessId: true },
      });
      if (user?.businessId) {
        await this.prisma.business.update({
          where: { id: user.businessId },
          data: { whatsappStatus: 'DISCONNECTED' },
        });
      }
    }
    return result;
  }

  // --- Chat Bot Monitoring ---

  @Get('chat/sessions')
  async listSessions(@Request() req, @Query('limit') limit?: string) {
    const business = await this.prisma.business.findFirst({
      where: { staff: { some: { id: req.user.id, role: 'OWNER' } } },
    });

    if (!business) {
      return { sessions: [] };
    }

    const sessions = await this.prisma.chatSession.findMany({
      where: { businessId: business.id },
      orderBy: { lastMessageAt: 'desc' },
      take: limit ? parseInt(limit, 10) : 50,
    });

    return { sessions };
  }

  @Get('chat/sessions/:id/logs')
  async getSessionLogs(@Param('id') sessionId: string) {
    const logs = await this.prisma.chatLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return { logs };
  }

  @Post('chat/sessions/:id/reset')
  async resetSession(@Param('id') sessionId: string) {
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        context: [],
        state: 'IDLE',
      },
    });

    return { success: true };
  }

  @Get('chat/stats')
  async getChatStats(@Request() req) {
    const business = await this.prisma.business.findFirst({
      where: { staff: { some: { id: req.user.id, role: 'OWNER' } } },
    });

    if (!business) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        intents: {},
      };
    }

    const [
      totalSessions,
      totalMessages,
      intentCounts,
    ] = await Promise.all([
      this.prisma.chatSession.count({ where: { businessId: business.id } }),
      this.prisma.chatLog.count({
        where: {
          session: { businessId: business.id },
        },
      }),
      this.prisma.chatLog.groupBy({
        by: ['intent'],
        where: {
          session: { businessId: business.id },
        },
        _count: { intent: true },
      }),
    ]);

    const intents: Record<string, number> = {};
    for (const row of intentCounts) {
      intents[row.intent] = row._count.intent;
    }

    return {
      totalSessions,
      totalMessages,
      intents,
    };
  }
}