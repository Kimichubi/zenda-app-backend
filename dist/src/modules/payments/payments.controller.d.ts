import { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";
import { PaymentsService } from "./payments.service";
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createPix(dto: CreatePixPaymentDto): Promise<import("./payments.entity").PaymentEntity>;
}
