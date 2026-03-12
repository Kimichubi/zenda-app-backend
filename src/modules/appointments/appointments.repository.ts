import { AppointmentEntity } from "./appointments.entity";

export abstract class AppointmentsRepository {
  abstract findManyByUserId(userId: string): Promise<AppointmentEntity[]>;
  abstract findConflict(
    userId: string,
    date: Date,
  ): Promise<AppointmentEntity | null>;
  abstract findByWeek(userId: string, startDate: Date): Promise<AppointmentEntity[]>;
  abstract create(
    userId: string,
    input: { clientId: string; date: Date },
  ): Promise<AppointmentEntity>;
  abstract updateStatus(
    id: string,
    userId: string,
    status: "CONFIRMED" | "CANCELLED" | "NO_SHOW",
  ): Promise<AppointmentEntity | null>;
}
