export interface PaymentEntity {
    id: string;
    appointmentId: string;
    amount: number;
    status: "PENDING" | "PAID" | "FAILED";
    pixCode: string;
    createdAt: Date;
}
