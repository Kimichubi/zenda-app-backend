import { Controller, Get, Put, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BusinessGuard } from '../../common/guards/business.guard';
import { Prisma } from '@prisma/client';

function requireBusinessId(req: any): string {
  if (!req.user?.businessId) {
    throw new BadRequestException("Nenhum negocio associado. Complete o onboarding.");
  }
  return req.user.businessId;
}

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get('public/:slug')
  async getPublicSettings(@Param('slug') slug: string) {
    return this.siteSettingsService.getSettingsBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Get()
  async getSettings(@Request() req) {
    return this.siteSettingsService.getSettingsByBusinessId(requireBusinessId(req));
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Put()
  async updateSettings(@Request() req, @Body() data: Prisma.SiteSettingsUpdateInput) {
    return this.siteSettingsService.updateSettings(requireBusinessId(req), data);
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Get('bot')
  async getBotSettings(@Request() req) {
    const settings = await this.siteSettingsService.getSettingsByBusinessId(requireBusinessId(req));
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

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Put('bot')
  async updateBotSettings(@Request() req, @Body() data: Prisma.SiteSettingsUpdateInput) {
    return this.siteSettingsService.updateSettings(requireBusinessId(req), data);
  }
}
