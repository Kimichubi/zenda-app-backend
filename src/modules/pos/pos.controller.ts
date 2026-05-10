import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { PosService } from "./pos.service";
import { CreateWalkInClientDto } from "./dto/create-walk-in-client.dto";
import { CreatePosAppointmentDto } from "./dto/create-pos-appointment.dto";
import { CheckoutAppointmentDto } from "./dto/checkout-appointment.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";

function requireBusinessId(req: any): string {
  if (!req.user?.businessId) {
    throw new BadRequestException("Nenhum negócio associado. Complete o onboarding.");
  }
  return req.user.businessId;
}

@Controller("pos")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get("appointments/today")
  getTodayAppointments(@Request() req: any) {
    return this.posService.getTodayAppointments(requireBusinessId(req));
  }

  @Get("appointments/:id")
  getAppointment(@Request() req: any, @Param("id") id: string) {
    return this.posService.getAppointmentById(requireBusinessId(req), id);
  }

  @Get("clients/search")
  searchClients(@Request() req: any, @Query("q") q: string) {
    return this.posService.quickSearchClients(requireBusinessId(req), q || "");
  }

  @Post("clients/walk-in")
  createWalkInClient(@Request() req: any, @Body() dto: CreateWalkInClientDto) {
    return this.posService.createWalkInClient(requireBusinessId(req), dto);
  }

  @Get("professionals")
  listProfessionals(@Request() req: any) {
    return this.posService.listProfessionals(requireBusinessId(req));
  }

  @Get("services")
  listServices(@Request() req: any) {
    return this.posService.listServices(requireBusinessId(req));
  }

  @Post("appointments")
  createAppointment(@Request() req: any, @Body() dto: CreatePosAppointmentDto) {
    return this.posService.createAppointment(requireBusinessId(req), dto);
  }

  @Post("appointments/:id/checkout")
  checkoutAppointment(@Request() req: any, @Param("id") id: string, @Body() dto: CheckoutAppointmentDto) {
    return this.posService.checkoutAppointment(requireBusinessId(req), id, dto);
  }

  @Patch("appointments/:id/status")
  updateStatus(@Request() req: any, @Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.posService.updateAppointmentStatus(requireBusinessId(req), id, dto.status);
  }

  @Get("daily-summary")
  getDailySummary(@Request() req: any) {
    return this.posService.getDailySummary(requireBusinessId(req));
  }
}
