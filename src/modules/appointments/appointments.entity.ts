import { AppointmentStatus } from "../../infrastructure/database/in-memory-database.service";

export interface AppointmentEntity {
  id: string;
  businessId: string;
  professionalId: string;
  clientId: string;
  serviceId: string | null;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  price: number | null;
  status: AppointmentStatus;
  service?: { name: string };
  client?: { name: string; phone?: string };
  professional?: { id: string; name: string; baseCommission?: number };
  business?: { id: string; name: string; pixKey?: string };
  createdAt: Date;
}
