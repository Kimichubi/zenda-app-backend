import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  async checkout(businessId: string, sellerId: string, data: { customerId?: string; items: { productId: string; quantity: number }[]; paymentMethod: string }) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const saleItems: { productId: string; quantity: number; price: number }[] = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(`Product ${product?.name || 'unknown'} out of stock`);
        }

        totalAmount += product.price * item.quantity;
        
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: { productId: item.productId, quantity: item.quantity, type: 'OUT', reason: 'SALE' },
        });

        saleItems.push({ productId: item.productId, quantity: item.quantity, price: product.price });
      }

      const sale = await tx.sale.create({
        data: {
          businessId,
          sellerId,
          customerId: data.customerId,
          totalAmount,
          paymentMethod: data.paymentMethod,
          items: { create: saleItems },
        },
      });

      return sale;
    });
  }
}
