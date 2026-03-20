import { Controller, Get, Post, Delete, UseGuards, Request, Logger } from '@nestjs/common';
import { WhatsappService } from '../../infrastructure/notifications/whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('WhatsappController initialized');
  }

  @Get('status')
  async getStatus(@Request() req) {
    const status = await this.whatsappService.getSessionStatus(req.user.id);
    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { whatsappStatus: status } as any,
    });
    return { status };
  }

  @Post('connect')
  async connect(@Request() req) {
    this.logger.log(`Starting connection for user ${req.user.id}`);
    return this.whatsappService.startSession(req.user.id);
  }

  @Get('qr')
  async getQR(@Request() req) {
    const qr = await this.whatsappService.getQRCode(req.user.id);
    return { qr };
  }

  @Delete('logout')
  async logout(@Request() req) {
    const result = await this.whatsappService.logoutSession(req.user.id);
    if (result.success) {
      await this.prisma.user.update({
        where: { id: req.user.id },
        data: { whatsappStatus: 'DISCONNECTED' } as any,
      });
    }
    return result;
  }
}