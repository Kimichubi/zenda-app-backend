import { Injectable } from "@nestjs/common";
import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { makeId } from "../../infrastructure/database/id.factory";
import { PaymentsRepository } from "./payments.repository";
import { PaymentEntity, PaymentStatus } from "./payments.entity";

@Injectable()
export class PaymentsInMemoryRepository implements PaymentsRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async create(input: {
    appointmentId: string;
    amount: number;
    pixCode?: string;
    status?: PaymentStatus;
    reason?: string;
  }): Promise<PaymentEntity> {
    const payment: any = {
      id: makeId(),
      appointmentId: input.appointmentId,
      amount: input.amount,
      status: input.status ?? "PENDING",
      pixCode: input.pixCode ?? null,
      reason: input.reason ?? null,
      paidAt: input.status === "PAID" ? new Date() : null,
      createdAt: new Date(),
    };

    this.db.payments.push(payment);
    return { ...payment };
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
    const userAppointmentIds = this.db.appointments
      .filter((a) => a.userId === userId)
      .map((a) => a.id);

    return this.db.payments
      .filter((p) => userAppointmentIds.includes(p.appointmentId))
      .map((p) => ({
        id: p.id,
        appointmentId: p.appointmentId,
        amount: p.amount,
        status: p.status as PaymentStatus,
        pixCode: p.pixCode,
        reason: p.reason,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      }));
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const p = this.db.payments.find((x) => x.id === id);
    if (!p) return null;
    return {
      ...p,
      status: p.status as PaymentStatus,
    };
  }

  async findByAppointmentId(appointmentId: string): Promise<PaymentEntity | null> {
    const p = this.db.payments.find((x) => x.appointmentId === appointmentId);
    if (!p) return null;
    return {
      ...p,
      status: p.status as PaymentStatus,
    };
  }

  async markAsPaid(id: string): Promise<PaymentEntity | null> {
    const idx = this.db.payments.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    this.db.payments[idx].status = "PAID";
    this.db.payments[idx].paidAt = new Date();
    const p = this.db.payments[idx];
    return {
      ...p,
      status: p.status as PaymentStatus,
    };
  }

  async cancel(id: string, reason?: string): Promise<PaymentEntity | null> {
    const idx = this.db.payments.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    this.db.payments[idx].status = "CANCELLED";
    this.db.payments[idx].reason = reason ?? null;
    const p = this.db.payments[idx];
    return {
      ...p,
      status: p.status as PaymentStatus,
    };
  }

  async updateStatus(id: string, status: PaymentStatus, reason?: string, pixCode?: string): Promise<PaymentEntity | null> {
    const idx = this.db.payments.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    this.db.payments[idx].status = status as any;
    if (reason !== undefined) this.db.payments[idx].reason = reason;
    if (pixCode !== undefined) this.db.payments[idx].pixCode = pixCode ?? null;
    if (status === "PAID") this.db.payments[idx].paidAt = new Date();
    const p = this.db.payments[idx];
    return {
      ...p,
      status: p.status as PaymentStatus,
    };
  }
}
