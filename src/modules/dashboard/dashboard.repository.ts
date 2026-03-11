import { DashboardSummary } from "./dashboard.entity";

export abstract class DashboardRepository {
  abstract summary(userId: string): Promise<DashboardSummary>;
}
