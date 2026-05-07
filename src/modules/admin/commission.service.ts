import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  async calculateForAppointment(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { professional: true },
    });

    if (!appointment || !appointment.professional) return;

    const percentage = appointment.professional.baseCommission;
    const amount = ((appointment.price || 0) * percentage) / 100;

    return this.prisma.commission.create({
      data: {
        userId: appointment.professional.id,
        appointmentId: appointment.id,
        amount,
        percentage,
        status: 'PENDING',
      },
    });
  }

  async getReport(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.commission.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { appointment: { include: { service: true } }, sale: true },
    });
  }

  async markAsPaid(commissionIds: string[]) {
    return this.prisma.commission.updateMany({
      where: { id: { in: commissionIds } },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }
}
