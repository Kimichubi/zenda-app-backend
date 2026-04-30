import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('public')
  async listPublic(@Query('businessId') businessId: string) {
    return this.reviewService.listPublic(businessId);
  }

  @Get('public/stats')
  async getStats(@Query('businessId') businessId: string) {
    return this.reviewService.getStats(businessId);
  }

  @Post()
  async create(@Body() body: {
    appointmentId: string;
    clientId: string;
    businessId: string;
    rating: number;
    comment?: string;
    serviceRating?: number;
    professionalRating?: number;
  }) {
    return this.reviewService.create(body);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  async reply(@Param('id') id: string, @Body('reply') reply: string) {
    return this.reviewService.reply(id, reply);
  }
}