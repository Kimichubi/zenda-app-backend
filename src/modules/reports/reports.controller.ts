import { Controller, Get, UseGuards, Request, Res } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ReportsService } from "./reports.service";
import type { Response } from "express";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get("appointments/export")
  async exportAppointments(@Request() req, @Res() res: Response) {
    const csv = await this.reportsService.exportAppointmentsCsv(req.user.id);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=agendamentos.csv");
    return res.status(200).send(csv);
  }

  @Get("payments/export")
  async exportPayments(@Request() req, @Res() res: Response) {
    const csv = await this.reportsService.exportPaymentsCsv(req.user.id);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=pagamentos.csv");
    return res.status(200).send(csv);
  }
}
