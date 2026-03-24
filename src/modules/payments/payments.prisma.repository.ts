import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { PaymentEntity, PaymentStatus } from "./payments.entity";
import { PaymentsRepository } from "./payments.repository";
import { Prisma } from "@prisma/client";
import { FindPaymentsDto } from "./dto/find-payments.dto";

@Injectable()
export class PaymentsPrismaRepository implements PaymentsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(input: {
    appointmentId: string;
    amount: number;
    pixCode?: string;
    status?: PaymentStatus;
    reason?: string;
  }): Promise<PaymentEntity> {
    const payment = await this.prisma.payment.create({
      data: {
        appointmentId: input.appointmentId,
        amount: input.amount,
        pixCode: input.pixCode,
        status: input.status || "PENDING",
        reason: input.reason,
      },
    });
    return {
      ...payment,
      status: payment.status as PaymentStatus,
      pixCode: payment.pixCode ?? null,
      reason: payment.reason ?? null,
      paidAt: payment.paidAt ?? null,
    };
  }

  async createPix(input: {
    appointmentId: string;
    amount: number;
    pixCode: string;
  }): Promise<PaymentEntity> {
    const p = await this.prisma.payment.create({
      data: {
        appointmentId: input.appointmentId,
        amount: input.amount,
        pixCode: input.pixCode,
        status: "PENDING",
      },
    });
    return {
      ...p,
      status: p.status as PaymentStatus,
      pixCode: p.pixCode ?? null,
      reason: p.reason ?? null,
      paidAt: p.paidAt ?? null,
    };
  }

  async findManyByUserId(
    userId: string,
    query: FindPaymentsDto = {},
  ): Promise<{ data: PaymentEntity[]; total: number }> {
    const { search, status, startDate, endDate, minAmount, maxAmount, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      appointment: { userId },
      AND: [
        search
          ? {
            OR: [
              { appointment: { client: { name: { contains: search, mode: "insensitive" } } } },
              { appointment: { service: { name: { contains: search, mode: "insensitive" } } } },
            ],
          }
          : {},
        status ? { status: status as any } : {},
        startDate ? { createdAt: { gte: new Date(startDate) } } : {},
        endDate ? { createdAt: { lte: new Date(endDate) } } : {},
        minAmount ? { amount: { gte: minAmount } } : {},
        maxAmount ? { amount: { lte: maxAmount } } : {},
      ],
    };

    const [total, payments] = await this.prisma.$transaction([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          appointment: {
            include: {
              client: true,
              service: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const data = payments.map((p) => ({
      id: p.id,
      appointmentId: p.appointmentId,
      clientName: p.appointment.client.name,
      serviceName: p.appointment.service?.name,
      amount: p.amount,
      status: p.status as PaymentStatus,
      pixCode: p.pixCode ?? null,
      reason: p.reason ?? null,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
    }));

    return { data, total };
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) return null;
    return {
      ...p,
      status: p.status as PaymentStatus,
      pixCode: p.pixCode ?? null,
      reason: p.reason ?? null,
      paidAt: p.paidAt ?? null,
    };
  }

  async findByAppointmentId(appointmentId: string): Promise<PaymentEntity | null> {
    const p = await this.prisma.payment.findFirst({ where: { appointmentId } });
    if (!p) return null;
    return {
      ...p,
      status: p.status as PaymentStatus,
      pixCode: p.pixCode ?? null,
      reason: p.reason ?? null,
      paidAt: p.paidAt ?? null,
    };
  }

  async markAsPaid(id: string): Promise<PaymentEntity | null> {
    const p = await this.prisma.payment.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });
    return {
      ...p,
      status: p.status as PaymentStatus,
      pixCode: p.pixCode ?? null,
      reason: p.reason ?? null,
      paidAt: p.paidAt ?? null,
    };
  }

  async cancel(id: string, reason?: string): Promise<PaymentEntity | null> {
    const p = await this.prisma.payment.update({
      where: { id },
      data: { status: "CANCELLED", reason },
    });
    return {
      ...p,
      status: p.status as PaymentStatus,
      pixCode: p.pixCode ?? null,
      reason: p.reason ?? null,
      paidAt: p.paidAt ?? null,
    };
  }

  async updateStatus(id: string, status: PaymentStatus, reason?: string, pixCode?: string): Promise<PaymentEntity | null> {
    const data: any = { status };
    if (reason !== undefined) data.reason = reason;
    if (pixCode !== undefined) data.pixCode = pixCode;
    if (status === "PAID") data.paidAt = new Date();

    const p = await this.prisma.payment.update({ where: { id }, data });
    return {
      ...p,
      status: p.status as PaymentStatus,
      pixCode: p.pixCode ?? null,
      reason: p.reason ?? null,
      paidAt: p.paidAt ?? null,
    };
  }
}
