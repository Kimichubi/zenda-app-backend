import { Global, Module } from "@nestjs/common";
import { RedisModule } from "../redis/redis.module";
import { PaymentQueueService } from "./payment.queue.service";

@Global()
@Module({
  imports: [RedisModule],
  providers: [PaymentQueueService],
  exports: [PaymentQueueService],
})
export class QueuesModule {}
