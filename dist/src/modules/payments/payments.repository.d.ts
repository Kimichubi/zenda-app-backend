import { PaymentEntity } from "./payments.entity";
export declare abstract class PaymentsRepository {
    abstract createPix(input: {
        appointmentId: string;
        amount: number;
        pixCode: string;
    }): Promise<PaymentEntity>;
}
