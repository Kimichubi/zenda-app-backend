import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { AppointmentEntity } from "./appointments.entity";
import { AppointmentsRepository } from "./appointments.repository";
export declare class AppointmentsInMemoryRepository implements AppointmentsRepository {
    private readonly db;
    constructor(db: InMemoryDatabaseService);
    findManyByUserId(userId: string): Promise<AppointmentEntity[]>;
    findConflict(userId: string, date: Date): Promise<AppointmentEntity | null>;
    create(userId: string, input: {
        clientId: string;
        date: Date;
    }): Promise<AppointmentEntity>;
    updateStatus(id: string, userId: string, status: "CONFIRMED" | "CANCELLED" | "NO_SHOW"): Promise<AppointmentEntity | null>;
}
