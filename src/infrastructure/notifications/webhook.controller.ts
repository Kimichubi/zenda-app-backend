import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WhatsappBotService } from '../../modules/whatsapp/whatsapp-bot.service';

@Controller('webhooks/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly botService: WhatsappBotService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingMessage(@Body() body: any) {
    try {
      const event = body.event;
      const payload = body.payload;
      const testMode = body.testMode === true;
      const testContext = body.context;

      if (event === 'message.received') {
        const fromPhone = payload.from;
        const text = payload.body?.trim() ?? '';
        const isFromMe = payload.fromMe ?? false;

        // Ignorar mensagens enviadas pelo próprio bot
        if (isFromMe) {
          return { status: 'ignored' };
        }

        const upperText = text.toUpperCase();

        // Manter compatibilidade com confirmação SIM/NAO do cron
        if (upperText === 'SIM' || upperText === 'NAO' || upperText === 'NÃO') {
          await this.processClientResponse(fromPhone, upperText);
          return { status: 'success' };
        }

        // Rotear para o bot de IA
        if (testMode) {
          const result = await this.botService.processTestMessage(fromPhone, text, testContext);
          return {
            status: 'success',
            testMode: true,
            response: result.response,
            intent: result.intent,
            confidence: result.confidence,
            model: result.model,
          };
        }

        await this.botService.processIncomingMessage(fromPhone, text);
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook do WAHA', error instanceof Error ? error.stack : String(error));
    }
    return { status: 'success' };
  }

  private async processClientResponse(phone: string, text: string) {
    let cleanPhone = phone.split('@')[0];
    if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
      cleanPhone = cleanPhone.substring(2);
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        client: {
          phone: {
            contains: cleanPhone,
          },
        },
        date: {
          gte: tomorrow,
          lte: endOfTomorrow,
        },
        status: 'SCHEDULED',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (appointments.length > 0) {
      const targetAppointment = appointments[0];
      const newStatus = text === 'SIM' ? 'CONFIRMED' : 'CANCELLED';

      await this.prisma.appointment.update({
        where: { id: targetAppointment.id },
        data: { status: newStatus },
      });

      this.logger.log(`WAHA: Agendamento ${targetAppointment.id} atualizado para ${newStatus} via cliente ${phone}`);
    }
  }
}