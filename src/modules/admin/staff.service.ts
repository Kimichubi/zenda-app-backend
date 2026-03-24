import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async addProfessional(businessId: string, data: { name: string; email: string; commission: number }) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: 'temporary_hash',
        role: 'PROFESSIONAL',
        businessId,
        baseCommission: data.commission,
      },
    });
  }

  async listStaff(businessId: string) {
    return this.prisma.user.findMany({
      where: { businessId },
      select: { id: true, name: true, email: true, role: true, baseCommission: true },
    });
  }

  async updateCommission(userId: string, percentage: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { baseCommission: percentage },
    });
  }
}
