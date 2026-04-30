import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { BookingService } from "../booking/booking.service";

export interface IntentResult {
  success: boolean;
  data?: unknown;
  message: string;
}

@Injectable()
export class IntentProcessorService {
  private readonly logger = new Logger(IntentProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingService: BookingService,
  ) {}

  async process(
    intent: string,
    action: Record<string, unknown> | undefined,
    businessId: string | undefined,
    clientId: string | undefined,
  ): Promise<IntentResult> {
    switch (intent) {
      case "QUERY_SERVICES":
        return this.queryServices(businessId);
      case "QUERY_SLOTS":
        return this.querySlots(
          businessId,
          action?.slug as string,
          action?.date as string,
          action?.serviceId as string,
        );
      case "BOOK":
        return this.bookAppointment(
          action?.slug as string,
          {
            serviceId: action?.serviceId as string,
            date: action?.date as string,
            startTime: action?.startTime as string,
            clientName: action?.clientName as string,
            clientPhone: action?.clientPhone as string,
            clientEmail: action?.clientEmail as string,
          },
        );
      case "CANCEL":
        return this.cancelAppointment(clientId, action?.appointmentId as string);
      case "QUERY_APPOINTMENTS":
        return this.queryAppointments(clientId);
      case "FALLBACK":
      default:
        return { success: false, message: "Não consegui entender o que você precisa. Posso te ajudar a agendar um horário, consultar seus agendamentos ou cancelar." };
    }
  }

  private async queryServices(businessId?: string): Promise<IntentResult> {
    if (!businessId) {
      return { success: false, message: "Desculpe, não consegui identificar o estabelecimento. Você pode me passar o link da agenda?" };
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: { include: { services: true } } },
    });

    if (!business) {
      return { success: false, message: "Não encontrei esse estabelecimento." };
    }

    const services = business.owner.services;
    if (services.length === 0) {
      return { success: false, message: "No momento não temos serviços cadastrados." };
    }

    const list = services.map((s) => `• ${s.name} — R$${s.price.toFixed(2)} (${s.duration}min)`).join("\n");
    return {
      success: true,
      data: services,
      message: `Aqui estão nossos serviços:\n${list}\n\nQual você gostaria de agendar?`,
    };
  }

  private async querySlots(
    businessId: string | undefined,
    slug: string | undefined,
    date: string | undefined,
    serviceId: string | undefined,
  ): Promise<IntentResult> {
    if (!slug || !date || !serviceId) {
      return { success: false, message: "Para mostrar os horários disponíveis, preciso saber qual serviço e qual data." };
    }

    try {
      const slots = await this.bookingService.getAvailableSlots(slug, date, serviceId);
      const available = slots.filter((s) => s.available);

      if (available.length === 0) {
        return { success: false, message: `Não temos horários disponíveis para ${date}. Que tal outro dia?` };
      }

      const times = available.map((s) => s.time).join(", ");
      return {
        success: true,
        data: available,
        message: `Horários disponíveis para ${date}:\n${times}\n\nQual horário prefere?`,
      };
    } catch (error) {
      this.logger.error("Erro ao buscar slots", error instanceof Error ? error.stack : String(error));
      return { success: false, message: "Desculpe, tive um problema ao buscar os horários. Tente novamente mais tarde." };
    }
  }

  private async bookAppointment(
    slug: string | undefined,
    dto: {
      serviceId: string;
      date: string;
      startTime: string;
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
    },
  ): Promise<IntentResult> {
    if (!slug || !dto.serviceId || !dto.date || !dto.startTime || !dto.clientName || !dto.clientPhone) {
      return { success: false, message: "Preciso de mais informações para agendar: serviço, data, horário e seu nome." };
    }

    try {
      await this.bookingService.createBooking(slug, dto as any);
      return {
        success: true,
        message: `Agendamento confirmado! ✅\n\n📅 ${dto.date}\n⏰ ${dto.startTime}\n\nTe esperamos!`,
      };
    } catch (error) {
      this.logger.error("Erro ao criar agendamento", error instanceof Error ? error.stack : String(error));
      if (error instanceof NotFoundException) {
        return { success: false, message: "Não encontrei o serviço ou profissional solicitado." };
      }
      return { success: false, message: "Esse horário não está mais disponível. Que tal outro?" };
    }
  }

  private async cancelAppointment(clientId: string | undefined, appointmentId: string | undefined): Promise<IntentResult> {
    if (appointmentId) {
      try {
        await this.prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: "CANCELLED" },
        });
        return { success: true, message: "Agendamento cancelado com sucesso. Sentiremos sua falta! 😔" };
      } catch {
        return { success: false, message: "Não consegui encontrar esse agendamento." };
      }
    }

    if (!clientId) {
      return { success: false, message: "Preciso saber quem você é para cancelar o agendamento." };
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        clientId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
      take: 5,
      include: { service: true },
    });

    if (appointments.length === 0) {
      return { success: false, message: "Você não tem agendamentos futuros para cancelar." };
    }

    if (appointments.length === 1) {
      await this.prisma.appointment.update({
        where: { id: appointments[0].id },
        data: { status: "CANCELLED" },
      });
      return { success: true, message: `Seu agendamento de ${appointments[0].service?.name} foi cancelado.` };
    }

    const list = appointments
      .map((a, i) => `${i + 1}. ${a.service?.name} — ${a.date.toLocaleDateString("pt-BR")} às ${a.startTime}`)
      .join("\n");

    return {
      success: true,
      data: appointments,
      message: `Você tem ${appointments.length} agendamentos:\n${list}\n\nQual deseja cancelar? (me diga o número)`,
    };
  }

  private async queryAppointments(clientId: string | undefined): Promise<IntentResult> {
    if (!clientId) {
      return { success: false, message: "Ainda não te reconheço. Qual seu nome e telefone para eu consultar seus agendamentos?" };
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        clientId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
      take: 5,
      include: { service: true, user: true },
    });

    if (appointments.length === 0) {
      return { success: false, message: "Você não tem agendamentos futuros. Quer agendar um horário?" };
    }

    const list = appointments
      .map((a) => `• ${a.service?.name} — ${a.date.toLocaleDateString("pt-BR")} às ${a.startTime} (${a.user.name})`)
      .join("\n");

    return {
      success: true,
      data: appointments,
      message: `Seus próximos agendamentos:\n${list}`,
    };
  }
}