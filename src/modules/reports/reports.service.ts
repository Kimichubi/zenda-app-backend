import { Injectable } from "@nestjs/common";
import { AppointmentsRepository } from "../appointments/appointments.repository";
import { PaymentsRepository } from "../payments/payments.repository";
import { format } from "date-fns";

@Injectable()
export class ReportsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly paymentsRepository: PaymentsRepository,
  ) {}

  async exportAppointmentsCsv(userId: string) {
    const appointments = await this.appointmentsRepository.findManyByUserId(userId);
    
    const header = "Data,Horario,Cliente,Servico,Valor,Status\n";
    const rows = appointments.map(apt => {
      const date = format(new Date(apt.date), "dd/MM/yyyy");
      const serviceName = apt.service?.name || "N/A";
      const clientName = apt.client?.name || "N/A";
      const price = apt.price ? apt.price.toFixed(2) : "0.00";
      
      return `${date},${apt.startTime},"${clientName}","${serviceName}",${price},${apt.status}`;
    }).join("\n");

    return header + rows;
  }

  async exportPaymentsCsv(userId: string) {
    const payments = await this.paymentsRepository.findManyByUserId(userId);
    
    const header = "Data Criacao,Data Pagamento,Cliente,Valor,Status,Motivo\n";
    const rows = payments.map(p => {
      const createdAt = format(new Date(p.createdAt), "dd/MM/yyyy HH:mm");
      const paidAt = p.paidAt ? format(new Date(p.paidAt), "dd/MM/yyyy HH:mm") : "Pendente";
      const clientName = p.clientName || "N/A";
      const amount = p.amount.toFixed(2);
      
      return `${createdAt},${paidAt},"${clientName}",${amount},${p.status},"${p.reason || ''}"`;
    }).join("\n");

    return header + rows;
  }
}
