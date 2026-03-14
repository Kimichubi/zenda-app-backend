import { Injectable } from "@nestjs/common";

export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "FAILED";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  businessName: string;
  slug: string;
  role: string;
  plan: string;
  createdAt: Date;
}

export interface ServiceRecord {
  id: string;
  userId: string;
  name: string;
  duration: number;
  price: number;
  createdAt: Date;
}

export interface ClientRecord {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface AppointmentRecord {
  id: string;
  userId: string;
  clientId: string;
  serviceId: string | null;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  price: number | null;
  status: AppointmentStatus;
  createdAt: Date;
}

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  amount: number;
  status: PaymentStatus;
  pixCode: string | null;
  reason: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

export interface ScheduleRecord {
  id: string;
  userId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

@Injectable()
export class InMemoryDatabaseService {
  users: UserRecord[] = [];
  services: ServiceRecord[] = [];
  clients: ClientRecord[] = [];
  appointments: AppointmentRecord[] = [];
  payments: PaymentRecord[] = [];
  schedules: ScheduleRecord[] = [];
}
