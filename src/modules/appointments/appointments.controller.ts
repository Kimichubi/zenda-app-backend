import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query, Logger } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("appointments")
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Get()
  async findAll(@Request() req) {
    return this.appointmentsService.listForUser(req.user.id);
  }

  @Get("week")
  async getByWeek(@Request() req, @Query("start") start: string) {
    return this.appointmentsService.listWeekly(req.user.id, start);
  }

  @Post(":id/resend-notification")
  async resendNotification(@Request() req, @Param("id") id: string) {
    this.logger.log(`Resending notification for appointment ${id}`);
    return this.appointmentsService.resendNotification(req.user.id, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.id, dto);
  }

  @Put(":id")
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(req.user.id, id, dto);
  }
}