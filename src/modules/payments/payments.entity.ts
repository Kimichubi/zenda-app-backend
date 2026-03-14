import { AppointmentStatus as AppointmentStatusPrisma, PaymentStatus as PaymentStatusPrisma } from "@prisma/client";

export type AppointmentStatus = AppointmentStatusPrisma;
export type PaymentStatus = PaymentStatusPrisma;

export interface PaymentEntity {
  id: string;
  appointmentId: string;
  amount: number;
  status: PaymentStatus;
  pixCode: string | null;
  reason: string | null;
  paidAt: Date | null;
  createdAt: Date;
}
