import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";

export interface BillingEvent {
  type: string;
  businessId?: string;
  subscriptionId?: string;
  invoiceId?: string;
  paymentId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class BillingEventPublisher {
  private readonly logger = new Logger(BillingEventPublisher.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async publish(event: BillingEvent): Promise<void> {
    this.logger.log(`Billing event: ${event.type}`);

    await this.prisma.auditLog.create({
      data: {
        businessId: event.businessId,
        action: event.type,
        entity: "billing",
        entityId: event.subscriptionId ?? event.invoiceId,
        metadata: (event.metadata ?? {}) as any,
      },
    });
  }
}
