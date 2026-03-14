import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import { PaymentQueueService } from "../../infrastructure/queues/payment.queue.service";
import { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";
import { PaymentsRepository } from "./payments.repository";
import { AppointmentsRepository } from "../appointments/appointments.repository";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    @Optional()
    private readonly paymentQueueService: PaymentQueueService,
  ) { }

  async createPix(dto: CreatePixPaymentDto) {
    let amount = dto.amount;

    if (!amount) {
      const appointment = await this.appointmentsRepository.findById(dto.appointmentId);
      if (!appointment) throw new NotFoundException("Appointment not found");
      amount = appointment.price || 0;
    }

    if (amount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const pixCode = `PIX-${makeId()}`;
    const existing = await this.paymentsRepository.findByAppointmentId(dto.appointmentId);
    
    if (existing) {
      return this.paymentsRepository.updateStatus(existing.id, "PENDING", undefined, pixCode); 
    }

    const payment = await this.paymentsRepository.createPix({
      appointmentId: dto.appointmentId,
      amount: amount as number,
      pixCode: pixCode,
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
