import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
export declare class DashboardService {
    private readonly db;
    constructor(db: InMemoryDatabaseService);
    summary(userId: string): {
        appointmentsCount: number;
        paidCount: number;
        pendingCount: number;
        totalRevenue: number;
    };
}
