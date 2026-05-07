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
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly prisma: PrismaService,
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

    const business: any = appointment.business;
    let pixCode = `PIX-${makeId()}`;

    if (business?.pixKey) {
      pixCode = PixGenerator.generate({
        key: business.pixKey,
        name: business.name,
        city: "SAO PAULO",
        amount: finalAmount,
        description: `Zenda: ${appointment.service?.name || 'Servico'}`,
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

    const business = appointment.business;

    let pixCode = payment.pixCode;

    if (!pixCode?.startsWith("000201") && business?.pixKey) {
      pixCode = PixGenerator.generate({
        key: business.pixKey,
        name: business.name,
        city: "SAO PAULO",
        amount: payment.amount,
        description: `Zenda: ${appointment.service?.name || 'Servico'}`,
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
      businessName: business?.name || "",
    };
  }

  async listForBusiness(
    businessId: string,
    query: FindPaymentsDto = {},
  ): Promise<PaginatedResponse<PaymentEntity>> {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.paymentsRepository.findManyByBusinessId(
      businessId,
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
