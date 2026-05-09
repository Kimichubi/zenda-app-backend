import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query, Logger, BadRequestException } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";

function mapAppointment(apt: any) {
  return {
    ...apt,
    clientName: apt.client?.name || "Cliente",
    serviceName: apt.service?.name || "Servico",
    professionalName: apt.professional?.name || "",
  };
}

function requireBusinessId(req: any): string {
  if (!req.user?.businessId) {
    throw new BadRequestException("Nenhum negocio associado. Complete o onboarding.");
  }
  return req.user.businessId;
}

@Controller("appointments")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Get()
  async findAll(@Request() req) {
    const businessId = requireBusinessId(req);
    const appointments = await this.appointmentsService.listForBusiness(businessId);
    return appointments.map(mapAppointment);
  }

  @Get("week")
  async getByWeek(@Request() req, @Query("start") start: string) {
    const businessId = requireBusinessId(req);
    const appointments = await this.appointmentsService.listWeekly(businessId, start);
    return appointments.map(mapAppointment);
  }

  @Post(":id/resend-notification")
  async resendNotification(@Request() req, @Param("id") id: string) {
    const businessId = requireBusinessId(req);
    this.logger.log(`Resending notification for appointment ${id}`);
    return this.appointmentsService.resendNotification(businessId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateAppointmentDto) {
    const businessId = requireBusinessId(req);
    const professionalId = dto.professionalId || req.user.id;
    const appointment = await this.appointmentsService.create(businessId, professionalId, dto);
    return mapAppointment(appointment);
  }

  @Put(":id")
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    const businessId = requireBusinessId(req);
    const appointment = await this.appointmentsService.update(businessId, id, dto);
    return appointment ? mapAppointment(appointment) : null;
  }
}
