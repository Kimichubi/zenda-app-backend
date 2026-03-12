import { AppointmentEntity } from "../appointments/appointments.entity";

export interface DashboardSummary {
  todayAppointments: AppointmentEntity[];
  upcomingAppointments: AppointmentEntity[];
  todayRevenue: number;
  noShowClients: AppointmentEntity[];
}
