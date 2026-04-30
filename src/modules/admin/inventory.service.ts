import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getMovements(businessId: string, productId?: string) {
    return this.prisma.inventoryMovement.findMany({
      where: {
        product: { businessId },
        ...(productId ? { productId } : {}),
      },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async restock(productId: string, businessId: string, quantity: number, reason: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, businessId } });
    if (!product) throw new Error('Product not found');
    if (quantity <= 0) throw new Error('Quantity must be positive');

    return this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      }),
      this.prisma.inventoryMovement.create({
        data: { productId, quantity, type: 'IN', reason },
      }),
    ]);
  }

  async getLowStock(businessId: string) {
    const products = await this.prisma.product.findMany({
      where: { businessId },
    });
    return products.filter(p => p.minStock > 0 && p.stock <= p.minStock);
  }
}