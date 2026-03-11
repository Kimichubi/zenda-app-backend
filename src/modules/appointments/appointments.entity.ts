import { AppointmentStatus } from "../../infrastructure/database/in-memory-database.service";

export interface AppointmentEntity {
  id: string;
  userId: string;
  clientId: string;
  date: Date;
  status: AppointmentStatus;
  createdAt: Date;
}
