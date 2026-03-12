import { PaymentStatus } from "../../infrastructure/database/in-memory-database.service";

export interface PaymentEntity {
  id: string;
  appointmentId: string;
  amount: number;
  status: PaymentStatus;
  pixCode: string;
  paidAt: Date | null;
  createdAt: Date;
}
