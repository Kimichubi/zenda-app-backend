"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const in_memory_database_service_1 = require("../../infrastructure/database/in-memory-database.service");
let DashboardService = class DashboardService {
    db;
    constructor(db) {
        this.db = db;
    }
    summary(userId) {
        const appointments = this.db.appointments.filter((item) => item.userId === userId);
        const payments = this.db.payments.filter((payment) => {
            const appointment = this.db.appointments.find((a) => a.id === payment.appointmentId);
            return appointment?.userId === userId;
        });
        const totalRevenue = payments
            .filter((payment) => payment.status === "PAID" || payment.status === "PENDING")
            .reduce((sum, payment) => sum + payment.amount, 0);
        return {
            appointmentsCount: appointments.length,
            paidCount: payments.filter((payment) => payment.status === "PAID").length,
            pendingCount: payments.filter((payment) => payment.status === "PENDING")
                .length,
            totalRevenue,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [in_memory_database_service_1.InMemoryDatabaseService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map