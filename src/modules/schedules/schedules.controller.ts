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
  list(@CurrentUser() user: { sub: string }) {
    return this.schedulesService.list(user.sub);
  }

  @Post()
  upsert(@CurrentUser() user: { sub: string }, @Body() dto: UpsertScheduleDto) {
    return this.schedulesService.upsert(user.sub, dto);
  }
}
