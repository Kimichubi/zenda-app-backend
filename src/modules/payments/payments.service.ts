import { Injectable, NotFoundException, BadRequestException, Optional } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import { PaymentQueueService } from "../../infrastructure/queues/payment.queue.service";
import { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";
import { PaymentsRepository } from "./payments.repository";
import { AppointmentsRepository } from "../appointments/appointments.repository";
import { PixGenerator } from "../../common/utils/pix-generator";
import { FindPaymentsDto } from "./dto/find-payments.dto";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";
import { PaymentEntity } from "./payments.entity";

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

    const appointment: any = await this.appointmentsRepository.findById(dto.appointmentId);
    if (!appointment) throw new NotFoundException("Appointment not found");

    if (!amount) {
      amount = appointment.price || 0;
    }

    const finalAmount = amount as number;

    if (finalAmount <= 0) {
      throw new BadRequestException("Payment amount must be greater than zero");
    }

    const user: any = appointment.user;
    let pixCode = `PIX-${makeId()}`;

    // Geração real de Pix se o usuário tiver configuração
    if (user.pixKey && user.pixName && user.pixCity) {
      pixCode = PixGenerator.generate({
        key: user.pixKey,
        name: user.pixName,
        city: user.pixCity,
        amount: finalAmount,
        description: `Zenda: ${appointment.service?.name || 'Serviço'}`,
        txid: appointment.id.replace(/-/g, "").substring(0, 25)
      });
    }

    const existing = await this.paymentsRepository.findByAppointmentId(dto.appointmentId);
    
    if (existing) {
      return this.paymentsRepository.updateStatus(existing.id, "PENDING", undefined, pixCode); 
    }

    const payment = await this.paymentsRepository.createPix({
      appointmentId: dto.appointmentId,
      amount: finalAmount,
      pixCode: pixCode,
    });

    if (this.paymentQueueService) {
      await this.paymentQueueService.enqueuePaymentStatusCheck(payment.id);
    }
    return payment;
  }

  async getPublicPaymentDetails(paymentId: string) {
    const payment = await this.paymentsRepository.findById(paymentId);
    if (!payment) throw new NotFoundException("Payment not found");

    const appointment: any = await this.appointmentsRepository.findById(payment.appointmentId);
    if (!appointment) throw new NotFoundException("Appointment not found");

    const user = appointment.user;
    
    let pixCode = payment.pixCode;

    // Se o usuário tem configuração Pix mas o pagamento não tem código (ou é simulado), geramos na hora
    if (!pixCode?.startsWith("000201") && user.pixKey && user.pixName && user.pixCity) {
      pixCode = PixGenerator.generate({
        key: user.pixKey,
        name: user.pixName,
        city: user.pixCity,
        amount: payment.amount,
        description: `Zenda: ${appointment.service?.name || 'Serviço'}`,
        txid: payment.id.replace(/-/g, "").substring(0, 25)
      });
    }

    return {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      pixCode,
      clientName: appointment.client.name,
      serviceName: appointment.service?.name,
      businessName: user.businessName || user.name,
    };
  }

  async listForUser(
    userId: string,
    query: FindPaymentsDto = {},
  ): Promise<PaginatedResponse<PaymentEntity>> {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.paymentsRepository.findManyByUserId(
      userId,
      query,
    );
    return { data, total, page, limit };
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
