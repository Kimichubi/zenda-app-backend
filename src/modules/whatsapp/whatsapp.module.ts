import { Module, forwardRef } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from '../../infrastructure/notifications/whatsapp.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { WebhookController } from '../../infrastructure/notifications/webhook.controller';
import { CronService } from '../../infrastructure/notifications/cron.service';
import { AiModule } from '../../infrastructure/ai/ai.module';
import { BookingModule } from '../booking/booking.module';
import { ChatSessionService } from './chat-session.service';
import { IntentProcessorService } from './intent-processor.service';
import { WhatsappBotService } from './whatsapp-bot.service';

@Module({
  imports: [
    DatabaseModule,
    AiModule,
    forwardRef(() => BookingModule),
  ],
  controllers: [WhatsappController, WebhookController],
  providers: [
    WhatsappService,
    CronService,
    ChatSessionService,
    IntentProcessorService,
    WhatsappBotService,
  ],
  exports: [WhatsappService, WhatsappBotService],
})
export class WhatsappModule {}