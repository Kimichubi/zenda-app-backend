import { AppointmentStatus } from "../../infrastructure/database/in-memory-database.service";

export interface AppointmentEntity {
  id: string;
  userId: string;
  clientId: string;
  serviceId: string | null;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  price: number | null;
  status: AppointmentStatus;
  service?: { name: string };
  client?: { name: string };
  user?: { name: string; businessName?: string; pixKey?: string; pixName?: string; pixCity?: string };
  createdAt: Date;
}
