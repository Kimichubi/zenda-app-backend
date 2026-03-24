import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { PaymentEntity, PaymentStatus } from "./payments.entity";
import { PaymentsRepository } from "./payments.repository";

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
    const p = await this.prisma.payment.create({
      data: {
        appointmentId: input.appointmentId,
        amount: input.amount,
        pixCode: input.pixCode ?? null,
        status: input.status ?? "PENDING",
        reason: input.reason ?? null,
      },
    });

    return {
      ...p,
      pixCode: p.pixCode ?? null,
      reason: p.reason ?? null,
      paidAt: p.paidAt ?? null,
    };
  }

  async createPix(input: {
    appointmentId: string;
    amount: number;
    pixCode: string;
  }): Promise<PaymentEntity> {
    return this.create({
      appointmentId: input.appointmentId,
      amount: input.amount,
      pixCode: input.pixCode,
      status: "PENDING",
    });
  }

  async findManyByUserId(userId: string): Promise<PaymentEntity[]> {
    const payments = await this.prisma.payment.findMany({
      where: { appointment: { userId } },
      include: {
        appointment: {
          include: {
            client: true,
            service: true,
          }
        }
      }
    });

    return payments.map((p) => ({
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
    const p = await this.prisma.payment.findUnique({ where: { appointmentId } });
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
      data: { status: "PAID", paidAt: new Date() } 
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
      data: { status: "CANCELLED", reason } 
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
