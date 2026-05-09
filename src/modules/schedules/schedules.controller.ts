import { Body, Controller, Delete, Get, Post, UseGuards, BadRequestException, Request, Query, Param } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { UpsertScheduleDto, BlockSlotDto, GetAvailabilityDto } from "./dto/upsert-schedule.dto";
import { SchedulesService } from "./schedules.service";
import { AvailabilityService } from "./availability.service";

function requireBusinessId(req: any): string {
  if (!req.user?.businessId) {
    throw new BadRequestException("Nenhum negocio associado. Complete o onboarding.");
  }
  return req.user.businessId;
}

@Controller("schedules")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly availabilityService: AvailabilityService,
  ) {}

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

  @Get("availability")
  async getAvailability(@Query() query: GetAvailabilityDto) {
    return this.availabilityService.getAvailability(query.professionalId, query.date, query.serviceId);
  }

  @Post("blocked-slots")
  blockSlot(@Request() req, @Body() dto: BlockSlotDto) {
    const businessId = requireBusinessId(req);
    const professionalId = (dto as any).professionalId || req.user.id;
    return this.schedulesService.blockSlot(businessId, professionalId, {
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      reason: dto.reason as any,
    });
  }

  @Delete("blocked-slots/:id")
  unblockSlot(@Request() req, @Param("id") id: string) {
    const businessId = requireBusinessId(req);
    return this.schedulesService.unblockSlot(id, businessId);
  }

  @Get("blocked-slots")
  listBlockedSlots(@Request() req, @Query("professionalId") professionalId: string, @Query("startDate") startDate: string, @Query("endDate") endDate: string) {
    const businessId = requireBusinessId(req);
    return this.schedulesService.listBlockedSlots(professionalId, new Date(startDate), new Date(endDate));
  }
}