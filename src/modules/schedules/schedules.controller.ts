import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UpsertScheduleDto } from "./dto/upsert-schedule.dto";
import { SchedulesService } from "./schedules.service";

@Controller("schedules")
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.schedulesService.list(user.id);
  }

  @Post()
  upsert(@CurrentUser() user: { id: string }, @Body() dto: UpsertScheduleDto) {
    return this.schedulesService.upsert(user.id, dto);
  }
}