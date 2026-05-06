import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query, Logger } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

function mapAppointment(apt: any) {
  return {
    ...apt,
    clientName: apt.client?.name || "Cliente",
    serviceName: apt.service?.name || "Serviço",
  };
}

@Controller("appointments")
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Get()
  async findAll(@Request() req) {
    const appointments = await this.appointmentsService.listForUser(req.user.id);
    return appointments.map(mapAppointment);
  }

  @Get("week")
  async getByWeek(@Request() req, @Query("start") start: string) {
    const appointments = await this.appointmentsService.listWeekly(req.user.id, start);
    return appointments.map(mapAppointment);
  }

  @Post(":id/resend-notification")
  async resendNotification(@Request() req, @Param("id") id: string) {
    this.logger.log(`Resending notification for appointment ${id}`);
    return this.appointmentsService.resendNotification(req.user.id, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateAppointmentDto) {
    const appointment = await this.appointmentsService.create(req.user.id, dto);
    return mapAppointment(appointment);
  }

  @Put(":id")
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    const appointment = await this.appointmentsService.update(req.user.id, id, dto);
    return appointment ? mapAppointment(appointment) : null;
  }
}