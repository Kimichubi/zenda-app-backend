import { Injectable } from "@nestjs/common";

export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "FAILED";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  businessId: string | null;
  role: string;
  baseCommission: number;
  createdAt: Date;
}

export interface BusinessRecord {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: Date;
}

export interface ServiceRecord {
  id: string;
  businessId: string;
  name: string;
  duration: number;
  price: number;
  createdAt: Date;
}

export interface ClientRecord {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
}

export interface AppointmentRecord {
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
  businessId: string;
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

@Injectable()
export class InMemoryDatabaseService {
  users: UserRecord[] = [];
  businesses: BusinessRecord[] = [];
  services: ServiceRecord[] = [];
  clients: ClientRecord[] = [];
  appointments: AppointmentRecord[] = [];
  payments: PaymentRecord[] = [];
  schedules: ScheduleRecord[] = [];
}
