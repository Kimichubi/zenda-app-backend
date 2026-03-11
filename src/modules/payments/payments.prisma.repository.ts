import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { PaymentEntity } from "./payments.entity";
import { PaymentsRepository } from "./payments.repository";

@Injectable()
export class PaymentsPrismaRepository implements PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

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
}
