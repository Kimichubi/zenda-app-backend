import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get('public/:slug')
  async getPublicSettings(@Param('slug') slug: string) {
    return this.siteSettingsService.getSettingsBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getSettings(@Request() req) {
    return this.siteSettingsService.getSettingsByUserId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateSettings(@Request() req, @Body() data: Prisma.SiteSettingsUpdateInput) {
    return this.siteSettingsService.updateSettings(req.user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bot')
  async getBotSettings(@Request() req) {
    const settings = await this.siteSettingsService.getSettingsByUserId(req.user.id);
    return {
      botEnabled: settings.botEnabled,
      botPrompt: settings.botPrompt,
      botTone: settings.botTone,
      botUseEmojis: settings.botUseEmojis,
      botMaxSentences: settings.botMaxSentences,
      aiProvider: settings.aiProvider,
      aiApiKey: settings.aiApiKey,
      aiModel: settings.aiModel,
      appointmentConfirmationTemplate: settings.appointmentConfirmationTemplate,
      appointmentReminderTemplate: settings.appointmentReminderTemplate,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('bot')
  async updateBotSettings(@Request() req, @Body() data: Prisma.SiteSettingsUpdateInput) {
    return this.siteSettingsService.updateSettings(req.user.id, data);
  }
}