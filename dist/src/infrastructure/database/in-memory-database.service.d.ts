export type AppointmentStatus = "CONFIRMED" | "CANCELLED" | "NO_SHOW";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export interface UserRecord {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
}
export interface ClientRecord {
    id: string;
    userId: string;
    name: string;
    phone: string;
    email: string | null;
    createdAt: Date;
}
export interface AppointmentRecord {
    id: string;
    userId: string;
    clientId: string;
    date: Date;
    status: AppointmentStatus;
    createdAt: Date;
}
export interface PaymentRecord {
    id: string;
    appointmentId: string;
    amount: number;
    status: PaymentStatus;
    pixCode: string;
    createdAt: Date;
}
export interface ScheduleRecord {
    id: string;
    userId: string;
    weekday: number;
    startTime: string;
    endTime: string;
}
export declare class InMemoryDatabaseService {
    users: UserRecord[];
    clients: ClientRecord[];
    appointments: AppointmentRecord[];
    payments: PaymentRecord[];
    schedules: ScheduleRecord[];
}
