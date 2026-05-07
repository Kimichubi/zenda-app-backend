import { Injectable, BadRequestException } from '@nestjs/common';
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

  async removeStaff(userId: string, businessId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, businessId } });
    if (!user) throw new BadRequestException('Staff member not found');
    if (user.role === 'OWNER') throw new BadRequestException('Cannot remove business owner');

    return this.prisma.user.update({
      where: { id: userId },
      data: { businessId: null, role: 'PROFESSIONAL', baseCommission: 0 },
    });
  }
}
