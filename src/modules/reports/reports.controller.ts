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
    const buffer = await this.reportsService.exportAppointmentsExcel(req.user.id);
    
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=agendamentos.xlsx");
    
    return res.status(200).send(buffer);
  }

  @Get("payments/export")
  async exportPayments(@Request() req, @Res() res: Response) {
    const buffer = await this.reportsService.exportPaymentsExcel(req.user.id);
    
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=financeiro.xlsx");
    
    return res.status(200).send(buffer);
  }
}
