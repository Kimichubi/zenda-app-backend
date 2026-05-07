import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Injectable()
export class PosCheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async checkoutAppointment(
    appointmentId: string,
    data: {
      tipAmount?: number;
      tipPercentage?: number;
      paymentMethod: string;
      useInternalCredit?: boolean;
      splitEnabled?: boolean;
    },
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, professional: true, business: true, service: true, payment: true },
    });

    if (!appointment) throw new NotFoundException("Agendamento nao encontrado");
    if (appointment.status !== "COMPLETED") {
      throw new BadRequestException("O agendamento precisa estar concluido para checkout");
    }

    const baseAmount = appointment.price ?? 0;
    const tipAmount = data.tipAmount ?? (data.tipPercentage ? (baseAmount * data.tipPercentage) / 100 : 0);
    const totalAmount = baseAmount + tipAmount;

    // Verificar credito interno
    let discountAmount = 0;
    if (data.useInternalCredit && appointment.clientId) {
      const credit = await this.prisma.clientCredit.findUnique({
        where: { clientId: appointment.clientId },
      });

      if (credit && credit.balance > 0) {
        discountAmount = Math.min(credit.balance, totalAmount);

        await this.prisma.clientCredit.update({
          where: { id: credit.id },
          data: { balance: { decrement: discountAmount } },
        });

        await this.prisma.clientCreditTransaction.create({
          data: {
            creditId: credit.id,
            amount: -discountAmount,
            type: "PAYMENT",
            description: `Pagamento agendamento ${appointmentId}`,
          },
        });
      }
    }

    const finalAmount = totalAmount - discountAmount;

    // Criar venda
    const sale = await this.prisma.sale.create({
      data: {
        businessId: appointment.businessId,
        sellerId: appointment.professionalId,
        customerId: appointment.clientId,
        totalAmount: finalAmount,
        tipAmount,
        discountAmount,
        paymentMethod: data.paymentMethod,
        splitConfig: (data.splitEnabled
          ? { professionalId: appointment.professionalId, percentage: appointment.professional.baseCommission }
          : null) as any,
      },
    });

    // Se split habilitado, criar transacao de split
    if (data.splitEnabled && appointment.professional.baseCommission > 0) {
      const professionalAmount = (finalAmount * appointment.professional.baseCommission) / 100;
      const businessAmount = finalAmount - professionalAmount;

      await this.prisma.splitTransaction.create({
        data: {
          saleId: sale.id,
          recipientId: appointment.professionalId,
          recipientType: "PROFESSIONAL",
          amount: professionalAmount,
          status: "PENDING",
        },
      });

      await this.prisma.splitTransaction.create({
        data: {
          saleId: sale.id,
          recipientId: appointment.businessId,
          recipientType: "BUSINESS",
          amount: businessAmount,
          status: "PENDING",
        },
      });
    }

    // Marcar pagamento como pago
    if (appointment.payment) {
      await this.prisma.payment.update({
        where: { appointmentId },
        data: { status: "PAID", paidAt: new Date() },
      });
    }

    return {
      sale,
      baseAmount,
      tipAmount,
      discountAmount,
      finalAmount,
    };
  }

  async getTipSuggestions(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || !appointment.price) {
      throw new NotFoundException("Agendamento nao encontrado");
    }

    const baseAmount = appointment.price;
    return {
      baseAmount,
      suggestions: [
        { percent: 10, amount: Math.round(baseAmount * 0.1 * 100) / 100 },
        { percent: 15, amount: Math.round(baseAmount * 0.15 * 100) / 100 },
        { percent: 20, amount: Math.round(baseAmount * 0.2 * 100) / 100 },
      ],
    };
  }

  async addClientCredit(clientId: string, amount: number, description: string) {
    if (amount <= 0) throw new BadRequestException("Valor deve ser positivo");

    let credit = await this.prisma.clientCredit.findUnique({
      where: { clientId },
    });

    if (!credit) {
      credit = await this.prisma.clientCredit.create({
        data: { clientId, balance: 0 },
      });
    }

    await this.prisma.clientCredit.update({
      where: { id: credit.id },
      data: { balance: { increment: amount } },
    });

    await this.prisma.clientCreditTransaction.create({
      data: {
        creditId: credit.id,
        amount,
        type: "DEPOSIT",
        description,
      },
    });

    return { success: true, newBalance: credit.balance + amount };
  }

  async getClientCredit(clientId: string) {
    const credit = await this.prisma.clientCredit.findUnique({
      where: { clientId },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });

    if (!credit) {
      return { balance: 0, transactions: [] };
    }

    return credit;
  }
}