import { AppointmentEntity } from "./appointments.entity";
import { AppointmentStatus } from "../../infrastructure/database/in-memory-database.service";

export abstract class AppointmentsRepository {
  abstract findManyByUserId(userId: string): Promise<AppointmentEntity[]>;
  abstract findManyByUserIdAndDate(userId: string, date: Date): Promise<AppointmentEntity[]>;
  abstract findRangeByUserId(userId: string, start: Date, end: Date): Promise<AppointmentEntity[]>;
  abstract findConflict(
    userId: string,
    date: Date,
    startTime?: string,
  ): Promise<AppointmentEntity | null>;
  abstract findByWeek(userId: string, startDate: Date): Promise<AppointmentEntity[]>;
  abstract findByClientId(clientId: string): Promise<AppointmentEntity[]>;
  abstract findById(id: string): Promise<AppointmentEntity | null>;
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
  abstract update(
    id: string,
    userId: string,
    input: {
      status?: AppointmentStatus;
      serviceId?: string;
      date?: string | Date;
      startTime?: string;
      endTime?: string;
      price?: number;
    },
  ): Promise<AppointmentEntity | null>;
  abstract updateStatus(
    id: string,
    userId: string,
    status: AppointmentStatus,
  ): Promise<AppointmentEntity | null>;
}
