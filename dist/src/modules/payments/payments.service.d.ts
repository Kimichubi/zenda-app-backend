import { PaymentQueueService } from "../../infrastructure/queues/payment.queue.service";
import { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";
import { PaymentsRepository } from "./payments.repository";
export declare class PaymentsService {
    private readonly paymentsRepository;
    private readonly paymentQueueService;
    constructor(paymentsRepository: PaymentsRepository, paymentQueueService: PaymentQueueService);
    createPix(dto: CreatePixPaymentDto): Promise<import("./payments.entity").PaymentEntity>;
}
