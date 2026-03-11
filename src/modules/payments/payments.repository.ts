import { PaymentEntity } from "./payments.entity";

export abstract class PaymentsRepository {
  abstract createPix(input: {
    appointmentId: string;
    amount: number;
    pixCode: string;
  }): Promise<PaymentEntity>;
}
