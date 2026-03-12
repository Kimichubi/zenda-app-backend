import { Injectable } from "@nestjs/common";
import { AppointmentsRepository } from "../appointments/appointments.repository";
import { PaymentsRepository } from "../payments/payments.repository";

@Injectable()
export class DashboardService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly paymentsRepository: PaymentsRepository,
  ) { }

  async summary(userId: string) {
    const [todayAppointments, upcomingAppointments, payments] =
      await Promise.all([
        this.appointmentsRepository.findTodayByUserId(userId),
        this.appointmentsRepository.findUpcomingByUserId(userId),
        this.paymentsRepository.findManyByUserId(userId),
      ]);

    const todayRevenue = payments
      .filter((p) => p.status === "PAID" && p.paidAt)
      .filter((p) => {
        const today = new Date();
        return (
          p.paidAt!.toDateString() === today.toDateString()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const noShowClients = todayAppointments.filter(
      (a) => a.status === "NO_SHOW",
    );

    return {
      todayAppointments,
      upcomingAppointments,
      todayRevenue,
      noShowClients,
    };
  }
}
