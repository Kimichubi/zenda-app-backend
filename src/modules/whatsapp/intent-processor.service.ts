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
        return { success: false, message: "Oi! 😊 Posso te ajudar com várias coisas:\n\n💇‍♂️ Ver nossos serviços\n📅 Agendar um horário\n📋 Consultar seus agendamentos\n❌ Cancelar um agendamento\n\nO que você precisa hoje?" };
    }
  }

  private async queryServices(businessId?: string): Promise<IntentResult> {
    if (!businessId) {
      return { success: false, message: "Desculpe, não consegui identificar o estabelecimento. Você pode me passar o link da agenda?" };
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { services: true },
    });

    if (!business) {
      return { success: false, message: "Não encontrei esse estabelecimento." };
    }

    const services = business.services;
    if (services.length === 0) {
      return { success: false, message: "No momento não temos serviços cadastrados." };
    }

    const list = services.map((s) => `💇‍♂️ *${s.name}* — R$${s.price.toFixed(2)} ⏱️ ${s.duration}min`).join("\n");
    return {
      success: true,
      data: services,
      message: `✨ *Nossos Serviços* ✨\n\n${list}\n\nQual desses você gostaria de agendar? É só me dizer o nome! 😊`,
    };
  }

  private async querySlots(
    businessId: string | undefined,
    slug: string | undefined,
    date: string | undefined,
    serviceId: string | undefined,
  ): Promise<IntentResult> {
    if (!slug || !date || !serviceId) {
      return { success: false, message: "Claro! Para te mostrar os horários, me diz qual serviço você quer e qual data! 😊" };
    }

    try {
      const slots = await this.bookingService.getAvailableSlots(slug, date, serviceId);
      const available = slots.filter((s) => s.available);

      if (available.length === 0) {
        return { success: false, message: `Ops! 😅 Não temos horários disponíveis para ${date}. Que tal outro dia? Me diz qual funciona melhor pra você!` };
      }

      const times = available.map((s) => s.time).join(", ");
      return {
        success: true,
        data: available,
        message: `✨ *Horários disponíveis para ${date}:* ✨\n\n⏰ ${times}\n\nQual desses horários funciona melhor pra você? 😊`,
      };
    } catch (error) {
      this.logger.error("Erro ao buscar slots", error instanceof Error ? error.stack : String(error));
      return { success: false, message: "Ops, tive um probleminha ao buscar os horários! 😅 Pode tentar de novo daqui a pouquinho?" };
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
        message: `🎉 *Agendamento Confirmado!* 🎉\n\n✂️ Serviço: ${dto.serviceId ? "agendado" : "confirmado"}\n📅 Data: ${dto.date}\n⏰ Horário: ${dto.startTime}\n\nEstamos te esperando! Qualquer coisa é só chamar. ✨`,
      };
    } catch (error) {
      this.logger.error("Erro ao criar agendamento", error instanceof Error ? error.stack : String(error));
      if (error instanceof NotFoundException) {
        return { success: false, message: "Hmm, não encontrei esse serviço ou profissional. Pode me confirmar qual você quer? 🤔" };
      }
      return { success: false, message: "Ops, esse horário acabou de ser ocupado! 😅 Que tal outro horário? Me diz qual dia e hora funciona pra você!" };
    }
  }

  private async cancelAppointment(clientId: string | undefined, appointmentId: string | undefined): Promise<IntentResult> {
    if (appointmentId) {
      try {
        await this.prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: "CANCELLED" },
        });
        return { success: true, message: "✅ *Cancelado com sucesso!* ✅\n\nSentiremos sua falta, mas quando quiser voltar é só chamar! Estamos aqui pra você. 😊" };
      } catch {
        return { success: false, message: "Hmm, não consegui encontrar esse agendamento. Pode me confirmar qual é? 🤔" };
      }
    }

    if (!clientId) {
      return { success: false, message: "Oi! Para eu cancelar seu agendamento, preciso saber quem você é. Qual seu nome e telefone? 😊" };
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
      include: { service: true, professional: true },
    });

    if (appointments.length === 0) {
      return { success: false, message: "📅 Você não tem agendamentos futuros no momento. Quer marcar um horário? É só me dizer qual serviço e quando! ✨" };
    }

    const list = appointments
      .map((a) => `📅 *${a.service?.name ?? "Serviço"}* — ${a.date.toLocaleDateString("pt-BR")} às ${a.startTime} ⏰ (${a.professional.name})`)
      .join("\n");

    return {
      success: true,
      data: appointments,
      message: `✨ *Seus Próximos Agendamentos* ✨\n\n${list}\n\nPrecisa cancelar ou remarcar algum? É só me avisar! 😊`,
    };
  }
}