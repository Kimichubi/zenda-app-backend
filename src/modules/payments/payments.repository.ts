import { PaymentEntity } from "./payments.entity";

export abstract class PaymentsRepository {
  abstract createPix(input: {
    appointmentId: string;
    amount: number;
    pixCode: string;
  }): Promise<PaymentEntity>;

  abstract findManyByUserId(userId: string): Promise<PaymentEntity[]>;
  abstract findById(id: string): Promise<PaymentEntity | null>;
  abstract markAsPaid(id: string): Promise<PaymentEntity | null>;
  abstract cancel(id: string): Promise<PaymentEntity | null>;
}
