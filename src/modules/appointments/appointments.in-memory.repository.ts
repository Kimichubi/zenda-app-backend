import { Injectable } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import {
  AppointmentRecord,
  InMemoryDatabaseService,
} from "../../infrastructure/database/in-memory-database.service";
import { AppointmentEntity } from "./appointments.entity";
import { AppointmentsRepository } from "./appointments.repository";

@Injectable()
export class AppointmentsInMemoryRepository implements AppointmentsRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async findManyByUserId(userId: string): Promise<AppointmentEntity[]> {
    return this.db.appointments.filter(
      (appointment) => appointment.userId === userId,
    );
  }

  async findByWeek(userId: string, startDate: Date): Promise<AppointmentEntity[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return this.db.appointments.filter((appointment) => {
      if (appointment.userId !== userId) return false;
      const d = appointment.date;
      return d >= start && d < end;
    });
  }

  async findConflict(
    userId: string,
    date: Date,
  ): Promise<AppointmentEntity | null> {
    return (
      this.db.appointments.find(
        (appointment) =>
          appointment.userId === userId &&
          appointment.date.toISOString() === date.toISOString() &&
          appointment.status !== "CANCELLED",
      ) ?? null
    );
  }

  async create(
    userId: string,
    input: { clientId: string; date: Date },
  ): Promise<AppointmentEntity> {
    const record: AppointmentRecord = {
      id: makeId(),
      userId,
      clientId: input.clientId,
      date: input.date,
      status: "CONFIRMED",
      createdAt: new Date(),
    };

    this.db.appointments.push(record);
    return record;
  }

  async updateStatus(
    id: string,
    userId: string,
    status: "CONFIRMED" | "CANCELLED" | "NO_SHOW",
  ): Promise<AppointmentEntity | null> {
    const index = this.db.appointments.findIndex(
      (appointment) => appointment.id === id && appointment.userId === userId,
    );

    if (index < 0) {
      return null;
    }

    this.db.appointments[index].status = status;
    return this.db.appointments[index];
  }
}
