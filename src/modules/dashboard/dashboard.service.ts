import { Injectable } from "@nestjs/common";
import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";

@Injectable()
export class DashboardService {
  constructor(private readonly db: InMemoryDatabaseService) {}

  summary(userId: string) {
    const appointments = this.db.appointments.filter(
      (item) => item.userId === userId,
    );
    const payments = this.db.payments.filter((payment) => {
      const appointment = this.db.appointments.find(
        (a) => a.id === payment.appointmentId,
      );
      return appointment?.userId === userId;
    });

    const totalRevenue = payments
      .filter(
        (payment) => payment.status === "PAID" || payment.status === "PENDING",
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      appointmentsCount: appointments.length,
      paidCount: payments.filter((payment) => payment.status === "PAID").length,
      pendingCount: payments.filter((payment) => payment.status === "PENDING")
        .length,
      totalRevenue,
    };
  }
}
