import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminders() {
    this.logger.log('Iniciando o envio de lembretes diários...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const appointments: any[] = await this.prisma.appointment.findMany({
      where: {
        date: {
          gte: tomorrow,
          lte: endOfTomorrow,
        },
        status: 'SCHEDULED',
      },
      include: {
        client: true,
        user: true,
        service: true,
      },
    });

    for (const appt of appointments) {
      try {
        if (!appt.client.phone || (appt.user.whatsappStatus !== 'SCANNING' && appt.user.whatsappStatus !== 'CONNECTED')) continue;
        const message = `Olá ${appt.client.name}, este é um lembrete do seu agendamento de ${appt.service?.name || 'Serviço'} amanhã, dia ${tomorrow.toLocaleDateString('pt-BR')} às ${appt.startTime} com ${appt.user.businessName}. Responda SIM para confirmar ou NAO para cancelar.`;
        await this.whatsappService.sendMessage(appt.userId, appt.client.phone, message);
      } catch (error) {
        this.logger.error(`Erro ao enviar lembrete para ${appt.client.phone}: ${error.message}`);
      }
    }
    this.logger.log(`Lembretes enviados para ${appointments.length} clientes.`);
  }
}