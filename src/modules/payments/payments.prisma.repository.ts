import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { PaymentEntity } from "./payments.entity";
import { PaymentsRepository } from "./payments.repository";

@Injectable()
export class PaymentsPrismaRepository implements PaymentsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createPix(input: {
    appointmentId: string;
    amount: number;
    pixCode: string;
  }): Promise<PaymentEntity> {
    return this.prisma.payment.create({
      data: {
        appointmentId: input.appointmentId,
        amount: input.amount,
        pixCode: input.pixCode,
        status: "PENDING",
      },
    });
  }

  async findManyByUserId(userId: string): Promise<PaymentEntity[]> {
    const payments = await this.prisma.payment.findMany({
      where: { appointment: { userId } },
      include: { appointment: { include: { client: true } } },
    });

    return payments.map((p) => ({
      id: p.id,
      appointmentId: p.appointmentId,
      amount: p.amount,
      status: p.status,
      pixCode: p.pixCode,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
    }));
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async markAsPaid(id: string): Promise<PaymentEntity | null> {
    return this.prisma.payment.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  }

  async cancel(id: string): Promise<PaymentEntity | null> {
    return this.prisma.payment.update({ where: { id }, data: { status: "CANCELLED" } });
  }
}
