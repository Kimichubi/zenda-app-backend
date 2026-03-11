import { DashboardService } from "./dashboard.service";
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    summary(user: {
        sub: string;
    }): {
        appointmentsCount: number;
        paidCount: number;
        pendingCount: number;
        totalRevenue: number;
    };
}
