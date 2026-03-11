import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import { PAYMENT_QUEUE } from "./queue.constants";

@Injectable()
export class PaymentQueueService implements OnModuleDestroy {
  private readonly queue: Queue;

  constructor() {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const url = new URL(redisUrl);
    this.queue = new Queue(PAYMENT_QUEUE, {
      connection: {
        host: url.hostname,
        port: Number(url.port || 6379),
      },
    });
  }

  async enqueuePaymentStatusCheck(paymentId: string): Promise<void> {
    await this.queue.add("check-payment-status", { paymentId });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
