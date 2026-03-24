import { PaymentEntity, PaymentStatus } from "./payments.entity";
import { FindPaymentsDto } from "./dto/find-payments.dto";

export abstract class PaymentsRepository {
  abstract create(input: {
    appointmentId: string;
    amount: number;
    pixCode?: string;
    status?: PaymentStatus;
    reason?: string;
  }): Promise<PaymentEntity>;

  abstract createPix(input: {
    appointmentId: string;
    amount: number;
    pixCode: string;
  }): Promise<PaymentEntity>;

  abstract findManyByUserId(
    userId: string,
    query?: FindPaymentsDto,
  ): Promise<{ data: PaymentEntity[]; total: number }>;
  abstract findById(id: string): Promise<PaymentEntity | null>;
  abstract findByAppointmentId(appointmentId: string): Promise<PaymentEntity | null>;
  abstract markAsPaid(id: string): Promise<PaymentEntity | null>;
  abstract cancel(id: string, reason?: string): Promise<PaymentEntity | null>;
  abstract updateStatus(id: string, status: PaymentStatus, reason?: string, pixCode?: string): Promise<PaymentEntity | null>;
}
