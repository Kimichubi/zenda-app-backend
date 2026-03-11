"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const id_factory_1 = require("../../infrastructure/database/id.factory");
const payment_queue_service_1 = require("../../infrastructure/queues/payment.queue.service");
const payments_repository_1 = require("./payments.repository");
let PaymentsService = class PaymentsService {
    paymentsRepository;
    paymentQueueService;
    constructor(paymentsRepository, paymentQueueService) {
        this.paymentsRepository = paymentsRepository;
        this.paymentQueueService = paymentQueueService;
    }
    async createPix(dto) {
        const payment = await this.paymentsRepository.createPix({
            appointmentId: dto.appointmentId,
            amount: dto.amount,
            pixCode: `PIX-${(0, id_factory_1.makeId)()}`,
        });
        if (this.paymentQueueService) {
            await this.paymentQueueService.enqueuePaymentStatusCheck(payment.id);
        }
        return payment;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [payments_repository_1.PaymentsRepository,
        payment_queue_service_1.PaymentQueueService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map