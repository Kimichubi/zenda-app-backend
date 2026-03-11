import { OnModuleDestroy } from "@nestjs/common";
export declare class PaymentQueueService implements OnModuleDestroy {
    private readonly queue;
    constructor();
    enqueuePaymentStatusCheck(paymentId: string): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
