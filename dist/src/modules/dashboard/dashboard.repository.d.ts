import { DashboardSummary } from "./dashboard.entity";
export declare abstract class DashboardRepository {
    abstract summary(userId: string): Promise<DashboardSummary>;
}
