import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async processSalePoints(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { 
        business: { 
          include: { 
            loyaltyConfig: true 
          } 
        } 
      },
    });

    if (!sale || !sale.customerId || !sale.business?.loyaltyConfig?.active) return;

    const pointsEarned = Math.floor(sale.totalAmount * (sale.business.loyaltyConfig.pointsPerReal || 1));

    await this.prisma.client.update({
      where: { id: sale.customerId },
      data: { pointsBalance: { increment: pointsEarned } },
    });

    return this.prisma.sale.update({
      where: { id: saleId },
      data: { loyaltyPoints: pointsEarned },
    });
  }

  async redeemPoints(clientId: string, points: number) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    
    if (!client || client.pointsBalance < points) {
      throw new Error('Insufficient points');
    }

    return this.prisma.client.update({
      where: { id: clientId },
      data: { pointsBalance: { decrement: points } },
    });
  }
}
