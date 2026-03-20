import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('webhooks/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingMessage(@Body() body: any) {
    try {
      const event = body.event;
      const payload = body.payload;

      if (event === 'message.received') {
        const fromPhone = payload.from;
        const text = payload.body?.trim().toUpperCase();

        if (text === 'SIM' || text === 'NAO' || text === 'NÃO') {
          await this.processClientResponse(fromPhone, text);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook do WAHA', error.stack);
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