import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { WhatsappService } from "../../infrastructure/notifications/whatsapp.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SelfServiceService {
  private readonly logger = new Logger(SelfServiceService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>("FRONTEND_URL") ?? "http://localhost:5173";
  }

  async generateRescheduleToken(appointmentId: string): Promise<string> {
    const token = this.randomToken(32);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        rescheduleToken: token,
        rescheduleExpiry: expiry,
      },
    });

    return token;
  }

  async sendRescheduleLink(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, professional: true, service: true },
    });

    if (!appointment || !appointment.client) return;

    const token = await this.generateRescheduleToken(appointmentId);
    const link = `${this.frontendUrl}/reagendar/${token}`;

    const message = `Oi ${appointment.client.name}! ✂️\n\nSeu agendamento de *${appointment.service?.name ?? "Servico"}* esta marcado para *${appointment.date.toLocaleDateString("pt-BR")}* as *${appointment.startTime}*.\n\nPrecisa remarcar ou cancelar?\n${link}\n\nLink valido por 7 dias.`;

    await this.whatsappService.sendMessage(
      appointment.businessId,
      appointment.client.phone,
      message,
    );

    this.logger.log(`Link de remarcacao enviado para ${appointment.client.phone}`);
  }

  async validateToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { rescheduleToken: token },
      include: { client: true, professional: true, service: true },
    });

    if (!appointment) {
      throw new NotFoundException("Link invalido ou expirado");
    }

    if (appointment.rescheduleExpiry && appointment.rescheduleExpiry < new Date()) {
      throw new BadRequestException("Link expirado");
    }

    if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
      throw new BadRequestException("Agendamento ja foi cancelado ou concluido");
    }

    return appointment;
  }

  async cancelByToken(token: string): Promise<{ success: boolean; message: string }> {
    const appointment = await this.validateToken(token);

    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED" },
    });

    return {
      success: true,
      message: `Seu agendamento de ${appointment.service?.name ?? "Servico"} foi cancelado com sucesso.`,
    };
  }

  async rescheduleByToken(
    token: string,
    newDate: string,
    newStartTime: string,
  ): Promise<{ success: boolean; message: string }> {
    const appointment = await this.validateToken(token);

    const date = new Date(newDate);
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        professionalId: appointment.professionalId,
        date,
        startTime: newStartTime,
        NOT: { id: appointment.id },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    if (conflict) {
      throw new ConflictException("Horario nao disponivel");
    }

    const service = appointment.serviceId
      ? await this.prisma.service.findUnique({ where: { id: appointment.serviceId } })
      : null;

    let endTime = appointment.endTime;
    if (service) {
      const [h, m] = newStartTime.split(":").map(Number);
      const endMinutes = h * 60 + m + service.duration;
      endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
    }

    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        date,
        startTime: newStartTime,
        endTime,
        status: "SCHEDULED",
        rescheduleToken: null,
        rescheduleExpiry: null,
      },
    });

    return {
      success: true,
      message: `Agendamento remarcado para ${date.toLocaleDateString("pt-BR")} as ${newStartTime}.`,
    };
  }

  private randomToken(length: number): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
