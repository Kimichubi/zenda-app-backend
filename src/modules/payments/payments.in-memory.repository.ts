import { Injectable } from "@nestjs/common";
import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { makeId } from "../../infrastructure/database/id.factory";
import { PaymentsRepository } from "./payments.repository";
import { PaymentEntity, PaymentStatus } from "./payments.entity";
import { FindPaymentsDto } from "./dto/find-payments.dto";

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

  async findManyByBusinessId(
    businessId: string,
    query: FindPaymentsDto = {},
  ): Promise<{ data: PaymentEntity[]; total: number }> {
    const { search, status, page = 1, limit = 10 } = query;

    let filtered = this.db.payments.filter((p) => {
      const appointment = this.db.appointments.find((a) => a.id === p.appointmentId);
      return appointment && appointment.businessId === businessId;
    });

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((p) => {
        const appointment = this.db.appointments.find((a) => a.id === p.appointmentId);
        if (!appointment) return false;
        const client = this.db.clients.find((c) => c.id === appointment.clientId);
        const svc = this.db.services.find((sv) => sv.id === appointment.serviceId);
        return (
          client?.name.toLowerCase().includes(s) ||
          svc?.name.toLowerCase().includes(s)
        );
      });
    }

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const payments = filtered.slice(skip, skip + limit);

    const data = payments.map((p) => {
      const appointment = this.db.appointments.find((a) => a.id === p.appointmentId);
      const client = appointment ? this.db.clients.find((c) => c.id === appointment.clientId) : null;
      const svc = appointment ? this.db.services.find((sv) => sv.id === appointment.serviceId) : null;

      return {
        id: p.id,
        appointmentId: p.appointmentId,
        clientName: client?.name || "Cliente",
        serviceName: svc?.name || "Servico",
        amount: p.amount,
        status: p.status as PaymentStatus,
        pixCode: p.pixCode ?? null,
        reason: p.reason ?? null,
        paidAt: p.paidAt ?? null,
        createdAt: p.createdAt,
      };
    });

    return { data, total };
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const p = this.db.payments.find((x) => x.id === id);
    if (!p) return null;
    return { ...p, status: p.status as PaymentStatus };
  }

  async findByAppointmentId(appointmentId: string): Promise<PaymentEntity | null> {
    const p = this.db.payments.find((x) => x.appointmentId === appointmentId);
    if (!p) return null;
    return { ...p, status: p.status as PaymentStatus };
  }

  async markAsPaid(id: string): Promise<PaymentEntity | null> {
    const idx = this.db.payments.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    this.db.payments[idx].status = "PAID";
    this.db.payments[idx].paidAt = new Date();
    const p = this.db.payments[idx];
    return { ...p, status: p.status as PaymentStatus };
  }

  async cancel(id: string, reason?: string): Promise<PaymentEntity | null> {
    const idx = this.db.payments.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    this.db.payments[idx].status = "CANCELLED";
    this.db.payments[idx].reason = reason ?? null;
    const p = this.db.payments[idx];
    return { ...p, status: p.status as PaymentStatus };
  }

  async updateStatus(id: string, status: PaymentStatus, reason?: string, pixCode?: string): Promise<PaymentEntity | null> {
    const idx = this.db.payments.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    this.db.payments[idx].status = status as any;
    if (reason !== undefined) this.db.payments[idx].reason = reason;
    if (pixCode !== undefined) this.db.payments[idx].pixCode = pixCode ?? null;
    if (status === "PAID") this.db.payments[idx].paidAt = new Date();
    const p = this.db.payments[idx];
    return { ...p, status: p.status as PaymentStatus };
  }
}
