import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from '../../infrastructure/notifications/whatsapp.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { WebhookController } from '../../infrastructure/notifications/webhook.controller';
import { CronService } from '../../infrastructure/notifications/cron.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WhatsappController, WebhookController],
  providers: [WhatsappService, CronService],
  exports: [WhatsappService],
})
export class WhatsappModule {}