import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { PaymentsRepository } from "./payments.repository";
import { PaymentEntity } from "./payments.entity";
export declare class PaymentsInMemoryRepository implements PaymentsRepository {
    private readonly db;
    constructor(db: InMemoryDatabaseService);
    createPix(input: {
        appointmentId: string;
        amount: number;
        pixCode: string;
    }): Promise<PaymentEntity>;
}
