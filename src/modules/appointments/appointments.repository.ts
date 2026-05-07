import { AppointmentEntity } from "./appointments.entity";
import { AppointmentStatus } from "../../infrastructure/database/in-memory-database.service";

export abstract class AppointmentsRepository {
  abstract findManyByBusinessId(businessId: string): Promise<AppointmentEntity[]>;
  abstract findManyByBusinessIdAndDate(businessId: string, date: Date): Promise<AppointmentEntity[]>;
  abstract findRangeByBusinessId(businessId: string, start: Date, end: Date): Promise<AppointmentEntity[]>;
  abstract findManyByProfessionalId(professionalId: string): Promise<AppointmentEntity[]>;
  abstract findTodayByProfessionalId(professionalId: string): Promise<AppointmentEntity[]>;
  abstract findUpcomingByProfessionalId(professionalId: string): Promise<AppointmentEntity[]>;
  abstract findConflict(
    professionalId: string,
    date: Date,
    startTime?: string,
  ): Promise<AppointmentEntity | null>;
  abstract findByWeek(professionalId: string, startDate: Date): Promise<AppointmentEntity[]>;
  abstract findByClientId(clientId: string): Promise<AppointmentEntity[]>;
  abstract findById(id: string): Promise<AppointmentEntity | null>;
  abstract create(
    input: {
      businessId: string;
      professionalId: string;
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
    businessId: string,
    input: {
      status?: AppointmentStatus;
      clientId?: string;
      serviceId?: string;
      date?: string | Date;
      startTime?: string;
      endTime?: string;
      price?: number;
    },
  ): Promise<AppointmentEntity | null>;
}
