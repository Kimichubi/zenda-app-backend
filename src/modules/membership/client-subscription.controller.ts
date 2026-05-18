import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { ClientSubscriptionService } from "./client-subscription.service";
import { CreateClientSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateClientSubscriptionDto } from "./dto/update-subscription.dto";
import { RecordUsageDto } from "./dto/record-usage.dto";

@Controller("membership/subscriptions")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class ClientSubscriptionController {
  constructor(private readonly subscriptionService: ClientSubscriptionService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateClientSubscriptionDto) {
    return this.subscriptionService.create(req.user.businessId, dto);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query("status") status?: string,
    @Query("planId") planId?: string,
    @Query("clientId") clientId?: string,
    @Query("overdue") overdue?: string,
  ) {
    return this.subscriptionService.findAll(req.user.businessId, {
      status,
      planId,
      clientId,
      overdue: overdue === "true",
    });
  }

  @Get("dashboard")
  getDashboard(@Request() req: any) {
    return this.subscriptionService.getActiveDashboard(req.user.businessId);
  }

  @Get(":id")
  findById(@Request() req: any, @Param("id") id: string) {
    return this.subscriptionService.findById(req.user.businessId, id);
  }

  @Patch(":id")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateClientSubscriptionDto,
  ) {
    return this.subscriptionService.update(req.user.businessId, id, dto);
  }

  @Post(":id/usage")
  recordUsage(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: RecordUsageDto,
  ) {
    return this.subscriptionService.recordUsage(req.user.businessId, id, dto);
  }
}
