import { Injectable, Optional } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import { PaymentQueueService } from "../../infrastructure/queues/payment.queue.service";
import { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";
import { PaymentsRepository } from "./payments.repository";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    @Optional()
    private readonly paymentQueueService: PaymentQueueService,
  ) { }

  async createPix(dto: CreatePixPaymentDto) {
    const payment = await this.paymentsRepository.createPix({
      appointmentId: dto.appointmentId,
      amount: dto.amount,
      pixCode: `PIX-${makeId()}`,
    });

    if (this.paymentQueueService) {
      await this.paymentQueueService.enqueuePaymentStatusCheck(payment.id);
    }
    return payment;
  }

  async listForUser(userId: string) {
    return this.paymentsRepository.findManyByUserId(userId);
  }

  async getById(id: string) {
    return this.paymentsRepository.findById(id);
  }

  async markAsPaid(id: string) {
    return this.paymentsRepository.markAsPaid(id);
  }

  async cancel(id: string) {
    return this.paymentsRepository.cancel(id);
  }
}
