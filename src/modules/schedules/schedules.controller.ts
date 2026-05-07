import { Body, Controller, Get, Post, UseGuards, BadRequestException, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { UpsertScheduleDto } from "./dto/upsert-schedule.dto";
import { SchedulesService } from "./schedules.service";

function requireBusinessId(req: any): string {
  if (!req.user?.businessId) {
    throw new BadRequestException("Nenhum negocio associado. Complete o onboarding.");
  }
  return req.user.businessId;
}

@Controller("schedules")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  list(@Request() req) {
    return this.schedulesService.listByBusiness(requireBusinessId(req));
  }

  @Post()
  upsert(@Request() req, @Body() dto: UpsertScheduleDto) {
    const businessId = requireBusinessId(req);
    const professionalId = (dto as any).professionalId || req.user.id;
    return this.schedulesService.upsert(businessId, professionalId, dto);
  }
}
