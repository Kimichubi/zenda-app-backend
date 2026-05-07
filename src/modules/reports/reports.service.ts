import { Injectable } from "@nestjs/common";
import { AppointmentsRepository } from "../appointments/appointments.repository";
import { PaymentsRepository } from "../payments/payments.repository";
import { format } from "date-fns";
import * as ExcelJS from "exceljs";

@Injectable()
export class ReportsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly paymentsRepository: PaymentsRepository,
  ) {}

  private async createStyledWorkbook(sheetName: string, headers: { header: string; key: string; width: number }[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = headers;

    // Estilizar Cabeçalho
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" }, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F46E5" }, // Indigo Zenda
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    return { workbook, worksheet };
  }

  async exportAppointmentsExcel(businessId: string) {
    const appointments = await this.appointmentsRepository.findManyByBusinessId(businessId);
    
    const { workbook, worksheet } = await this.createStyledWorkbook("Agendamentos", [
      { header: "DATA", key: "date", width: 15 },
      { header: "HORÁRIO", key: "time", width: 12 },
      { header: "CLIENTE", key: "client", width: 30 },
      { header: "SERVIÇO", key: "service", width: 25 },
      { header: "VALOR", key: "price", width: 15 },
      { header: "STATUS", key: "status", width: 15 },
    ]);

    appointments.forEach(apt => {
      const row = worksheet.addRow({
        date: format(new Date(apt.date), "dd/MM/yyyy"),
        time: apt.startTime,
        client: apt.client?.name || "N/A",
        service: apt.service?.name || "N/A",
        price: apt.price || 0,
        status: apt.status,
      });

      // Formatação de Moeda
      row.getCell("price").numFmt = '"R$ " #,##0.00';
    });

    return workbook.xlsx.writeBuffer();
  }

  async exportPaymentsExcel(businessId: string) {
    const paymentsResponse = await this.paymentsRepository.findManyByBusinessId(businessId, { limit: 10000 });
    const payments = paymentsResponse.data;
    
    const { workbook, worksheet } = await this.createStyledWorkbook("Financeiro", [
      { header: "DATA CRIAÇÃO", key: "createdAt", width: 20 },
      { header: "DATA PAGAMENTO", key: "paidAt", width: 20 },
      { header: "CLIENTE", key: "client", width: 30 },
      { header: "VALOR", key: "amount", width: 15 },
      { header: "STATUS", key: "status", width: 15 },
      { header: "MOTIVO/SERVIÇO", key: "reason", width: 25 },
    ]);

    payments.forEach(p => {
      const row = worksheet.addRow({
        createdAt: format(new Date(p.createdAt), "dd/MM/yyyy HH:mm"),
        paidAt: p.paidAt ? format(new Date(p.paidAt), "dd/MM/yyyy HH:mm") : "Pendente",
        client: p.clientName || "N/A",
        amount: p.amount,
        status: p.status,
        reason: p.serviceName || p.reason || "",
      });

      row.getCell("amount").numFmt = '"R$ " #,##0.00';
    });

    return workbook.xlsx.writeBuffer();
  }
}
