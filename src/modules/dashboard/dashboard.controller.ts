import { Controller, Get, UseGuards, BadRequestException, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { DashboardService } from "./dashboard.service";

function requireBusinessId(req: any): string {
  if (!req.user?.businessId) {
    throw new BadRequestException("Nenhum negocio associado. Complete o onboarding.");
  }
  return req.user.businessId;
}

@Controller("dashboard")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  summary(@Request() req) {
    return this.dashboardService.summary(requireBusinessId(req), req.user.id);
  }
}
