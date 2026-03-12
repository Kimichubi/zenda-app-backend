import { AppointmentEntity } from "./appointments.entity";
import { AppointmentStatus } from "../../infrastructure/database/in-memory-database.service";

export abstract class AppointmentsRepository {
  abstract findManyByUserId(userId: string): Promise<AppointmentEntity[]>;
  abstract findConflict(
    userId: string,
    date: Date,
    startTime?: string,
  ): Promise<AppointmentEntity | null>;
  abstract findByWeek(userId: string, startDate: Date): Promise<AppointmentEntity[]>;
  abstract findByClientId(clientId: string): Promise<AppointmentEntity[]>;
  abstract findTodayByUserId(userId: string): Promise<AppointmentEntity[]>;
  abstract findUpcomingByUserId(userId: string): Promise<AppointmentEntity[]>;
  abstract create(
    userId: string,
    input: {
      clientId: string;
      serviceId?: string;
      date: Date;
      startTime?: string;
      endTime?: string;
      price?: number;
    },
  ): Promise<AppointmentEntity>;
  abstract updateStatus(
    id: string,
    userId: string,
    status: AppointmentStatus,
  ): Promise<AppointmentEntity | null>;
}
