import { Injectable } from "@nestjs/common";
import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { makeId } from "../../infrastructure/database/id.factory";
import { PaymentsRepository } from "./payments.repository";
import { PaymentEntity } from "./payments.entity";

@Injectable()
export class PaymentsInMemoryRepository implements PaymentsRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async createPix(input: {
    appointmentId: string;
    amount: number;
    pixCode: string;
  }): Promise<PaymentEntity> {
    const payment: PaymentEntity = {
      id: makeId(),
      appointmentId: input.appointmentId,
      amount: input.amount,
      status: "PENDING",
      pixCode: input.pixCode,
      createdAt: new Date(),
    };

    this.db.payments.push(payment);
    return payment;
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
        status: p.status,
        pixCode: p.pixCode,
        createdAt: p.createdAt,
      }));
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const p = this.db.payments.find((x) => x.id === id);
    return p ? { ...p } : null;
  }

  async markAsPaid(id: string): Promise<PaymentEntity | null> {
    const idx = this.db.payments.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    this.db.payments[idx].status = "PAID";
    return { ...this.db.payments[idx] };
  }

  async cancel(id: string): Promise<PaymentEntity | null> {
    const idx = this.db.payments.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    this.db.payments[idx].status = "FAILED";
    return { ...this.db.payments[idx] };
  }
}
