import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { AppointmentEntity } from "./appointments.entity";
import { AppointmentsRepository } from "./appointments.repository";

@Injectable()
export class AppointmentsPrismaRepository implements AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findManyByUserId(userId: string): Promise<AppointmentEntity[]> {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });
  }

  async findConflict(
    userId: string,
    date: Date,
  ): Promise<AppointmentEntity | null> {
    return this.prisma.appointment.findFirst({
      where: {
        userId,
        date,
        NOT: { status: "CANCELLED" },
      },
    });
  }

  async findByWeek(userId: string, startDate: Date): Promise<AppointmentEntity[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return this.prisma.appointment.findMany({
      where: {
        userId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: "asc" },
    });
  }

  async create(
    userId: string,
    input: { clientId: string; date: Date },
  ): Promise<AppointmentEntity> {
    return this.prisma.appointment.create({
      data: {
        userId,
        clientId: input.clientId,
        date: input.date,
        status: "CONFIRMED",
      },
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    status: "CONFIRMED" | "CANCELLED" | "NO_SHOW",
  ): Promise<AppointmentEntity | null> {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return null;
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }
}
