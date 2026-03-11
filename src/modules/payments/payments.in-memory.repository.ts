import { Injectable } from "@nestjs/common";
import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { makeId } from "../../infrastructure/database/id.factory";
import { PaymentsRepository } from "./payments.repository";
import { PaymentEntity } from "./payments.entity";

@Injectable()
export class PaymentsInMemoryRepository implements PaymentsRepository {
  constructor(private readonly db: InMemoryDatabaseService) {}

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
}
