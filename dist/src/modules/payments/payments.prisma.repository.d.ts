import { PrismaService } from "../../infrastructure/database/prisma.service";
import { PaymentEntity } from "./payments.entity";
import { PaymentsRepository } from "./payments.repository";
export declare class PaymentsPrismaRepository implements PaymentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPix(input: {
        appointmentId: string;
        amount: number;
        pixCode: string;
    }): Promise<PaymentEntity>;
}
