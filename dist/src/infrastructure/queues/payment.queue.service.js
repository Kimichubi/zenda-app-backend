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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentQueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const queue_constants_1 = require("./queue.constants");
let PaymentQueueService = class PaymentQueueService {
    queue;
    constructor() {
        const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
        const url = new URL(redisUrl);
        this.queue = new bullmq_1.Queue(queue_constants_1.PAYMENT_QUEUE, {
            connection: {
                host: url.hostname,
                port: Number(url.port || 6379),
            },
        });
    }
    async enqueuePaymentStatusCheck(paymentId) {
        await this.queue.add("check-payment-status", { paymentId });
    }
    async onModuleDestroy() {
        await this.queue.close();
    }
};
exports.PaymentQueueService = PaymentQueueService;
exports.PaymentQueueService = PaymentQueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PaymentQueueService);
//# sourceMappingURL=payment.queue.service.js.map