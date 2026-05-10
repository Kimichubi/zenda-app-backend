import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { CreateWalkInClientDto } from "./dto/create-walk-in-client.dto";
import { CreatePosAppointmentDto } from "./dto/create-pos-appointment.dto";
import { CheckoutAppointmentDto } from "./dto/checkout-appointment.dto";

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayAppointments(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: today, lt: tomorrow },
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
        professional: { select: { id: true, name: true } },
        payment: { select: { id: true, status: true, amount: true, pixCode: true } },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async getAppointmentById(businessId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true, pointsBalance: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
        professional: { select: { id: true, name: true, baseCommission: true } },
        payment: { select: { id: true, status: true, amount: true, pixCode: true, paidAt: true } },
      },
    });

    if (!appointment) throw new NotFoundException("Agendamento nao encontrado");
    return appointment;
  }

  async quickSearchClients(businessId: string, query: string) {
    return this.prisma.client.findMany({
      where: {
        businessId,
        status: "ACTIVE",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        pointsBalance: true,
      },
      take: 20,
      orderBy: { name: "asc" },
    });
  }

  async createWalkInClient(businessId: string, dto: CreateWalkInClientDto) {
    const client = await this.prisma.client.create({
      data: {
        businessId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        status: "ACTIVE",
        tags: [],
        credit: { create: { balance: 0 } },
      },
    });

    return client;
  }

  async listProfessionals(businessId: string) {
    return this.prisma.user.findMany({
      where: {
        businessId,
        OR: [
          { role: "PROFESSIONAL" },
          { role: "OWNER" },
          { role: "MANAGER" },
        ],
      },
      select: {
        id: true,
        name: true,
        role: true,
        baseCommission: true,
        avatarPath: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async listServices(businessId: string) {
    return this.prisma.service.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        duration: true,
        price: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async createAppointment(businessId: string, dto: CreatePosAppointmentDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, businessId },
    });

    if (!service) throw new NotFoundException("Servico nao encontrado");

    const professional = await this.prisma.user.findFirst({
      where: { id: dto.professionalId, businessId },
    });

    if (!professional) throw new NotFoundException("Profissional nao encontrado");

    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, businessId },
    });

    if (!client) throw new NotFoundException("Cliente nao encontrado");

    const appointmentDate = dto.date ? new Date(dto.date) : new Date();
    appointmentDate.setHours(0, 0, 0, 0);

    const startTime = dto.startTime || new Date().toTimeString().slice(0, 5);
    const price = dto.price ?? service.price;

    const endTime = this.calculateEndTime(startTime, service.duration);

    const appointment = await this.prisma.appointment.create({
      data: {
        businessId,
        professionalId: dto.professionalId,
        clientId: dto.clientId,
        serviceId: dto.serviceId,
        date: appointmentDate,
        startTime,
        endTime,
        price,
        status: "CONFIRMED",
        source: "POS",
        notes: dto.notes,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
        professional: { select: { id: true, name: true } },
        payment: true,
      },
    });

    return appointment;
  }

  async checkoutAppointment(businessId: string, appointmentId: string, dto: CheckoutAppointmentDto) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
      include: {
        client: { select: { id: true, name: true } },
        professional: { select: { id: true, baseCommission: true, name: true } },
        service: { select: { id: true, name: true, price: true } },
        payment: true,
      },
    });

    if (!appointment) throw new NotFoundException("Agendamento nao encontrado");

    const baseAmount = appointment.price ?? 0;
    const tipAmount = dto.tipAmount ?? (dto.tipPercentage ? (baseAmount * dto.tipPercentage) / 100 : 0);
    const totalAmount = baseAmount + tipAmount;

    let discountAmount = 0;

    if (dto.useInternalCredit && appointment.clientId) {
      const credit = await this.prisma.clientCredit.findUnique({
        where: { clientId: appointment.clientId },
      });

      if (credit && credit.balance > 0) {
        discountAmount = Math.min(credit.balance, totalAmount);

        await this.prisma.clientCredit.update({
          where: { id: credit.id },
          data: { balance: { decrement: discountAmount } },
        });

        await this.prisma.clientCreditTransaction.create({
          data: {
            creditId: credit.id,
            amount: -discountAmount,
            type: "PAYMENT",
            description: `Pagamento agendamento ${appointmentId}`,
          },
        });
      }
    }

    const finalAmount = totalAmount - discountAmount;

    const sale = await this.prisma.sale.create({
      data: {
        businessId,
        sellerId: appointment.professionalId,
        customerId: appointment.clientId,
        totalAmount: finalAmount,
        tipAmount,
        discountAmount,
        paymentMethod: dto.paymentMethod,
        splitConfig: dto.splitEnabled
          ? { professionalId: appointment.professionalId, percentage: appointment.professional.baseCommission }
          : (null as unknown as any),
      },
    });

    if (dto.splitEnabled && appointment.professional.baseCommission > 0) {
      const professionalAmount = (finalAmount * appointment.professional.baseCommission) / 100;
      const businessAmount = finalAmount - professionalAmount;

      await this.prisma.splitTransaction.create({
        data: {
          saleId: sale.id,
          recipientId: appointment.professionalId,
          recipientType: "PROFESSIONAL",
          amount: professionalAmount,
          status: "PENDING",
        },
      });

      await this.prisma.splitTransaction.create({
        data: {
          saleId: sale.id,
          recipientId: businessId,
          recipientType: "BUSINESS",
          amount: businessAmount,
          status: "PENDING",
        },
      });
    }

    if (appointment.payment) {
      await this.prisma.payment.update({
        where: { id: appointment.payment.id },
        data: { status: "PAID", paidAt: new Date() },
      });
    } else if (finalAmount > 0) {
      await this.prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          amount: finalAmount,
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "COMPLETED" },
    });

    return {
      sale,
      appointment: { id: appointmentId, status: "COMPLETED" },
      baseAmount,
      tipAmount,
      discountAmount,
      finalAmount,
    };
  }

  async updateAppointmentStatus(businessId: string, appointmentId: string, status: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
    });

    if (!appointment) throw new NotFoundException("Agendamento nao encontrado");

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: status as any },
      include: {
        client: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        payment: true,
      },
    });
  }

  async getDailySummary(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      appointments,
      todayPayments,
      totalPaid,
      salesToday,
      salesByMethod,
    ] = await Promise.all([
      this.prisma.appointment.groupBy({
        by: ["status"],
        where: { businessId, date: { gte: today, lt: tomorrow } },
        _count: { status: true },
      }),

      this.prisma.payment.aggregate({
        where: {
          appointment: { businessId, date: { gte: today, lt: tomorrow } },
          status: "PENDING",
        },
        _sum: { amount: true },
      }),

      this.prisma.payment.aggregate({
        where: {
          appointment: { businessId, date: { gte: today, lt: tomorrow } },
          status: "PAID",
        },
        _sum: { amount: true },
      }),

      this.prisma.sale.aggregate({
        where: { businessId, createdAt: { gte: today, lt: tomorrow } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      this.prisma.sale.groupBy({
        by: ["paymentMethod"],
        where: { businessId, createdAt: { gte: today, lt: tomorrow } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const item of appointments) {
      statusCounts[item.status] = item._count.status;
    }

    return {
      date: today.toISOString().slice(0, 10),
      totalRevenue: totalPaid._sum.amount ?? 0,
      totalPending: todayPayments._sum.amount ?? 0,
      totalProductsSales: salesToday._sum.totalAmount ?? 0,
      totalSalesCount: salesToday._count.id ?? 0,
      appointments: {
        scheduled: statusCounts["SCHEDULED"] ?? 0,
        confirmed: statusCounts["CONFIRMED"] ?? 0,
        completed: statusCounts["COMPLETED"] ?? 0,
        cancelled: statusCounts["CANCELLED"] ?? 0,
        noShow: statusCounts["NO_SHOW"] ?? 0,
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      },
      salesByMethod: salesByMethod.map((s) => ({
        method: s.paymentMethod,
        total: s._sum.totalAmount ?? 0,
        count: s._count.id,
      })),
    };
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [h, m] = startTime.split(":").map(Number);
    const totalMinutes = h * 60 + m + durationMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
  }
}
