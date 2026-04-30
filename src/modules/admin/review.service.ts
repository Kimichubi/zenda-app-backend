import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    appointmentId: string;
    clientId: string;
    businessId: string;
    rating: number;
    comment?: string;
    serviceRating?: number;
    professionalRating?: number;
  }) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException("Avaliacao deve ser entre 1 e 5 estrelas");
    }

    const existing = await this.prisma.review.findUnique({
      where: { appointmentId: data.appointmentId },
    });

    if (existing) {
      throw new BadRequestException("Este agendamento ja foi avaliado");
    }

    return this.prisma.review.create({
      data: {
        clientId: data.clientId,
        appointmentId: data.appointmentId,
        businessId: data.businessId,
        rating: data.rating,
        comment: data.comment,
        serviceRating: data.serviceRating,
        professionalRating: data.professionalRating,
      },
    });
  }

  async listPublic(businessId: string) {
    return this.prisma.review.findMany({
      where: { businessId, isPublic: true },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
        appointment: { include: { service: { select: { name: true } } } },
      },
      take: 100,
    });
  }

  async getStats(businessId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { businessId, isPublic: true },
    });

    if (reviews.length === 0) {
      return {
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const total = reviews.length;
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const r of reviews) {
      distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
    }

    return { total, average, distribution };
  }

  async reply(reviewId: string, reply: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException("Avaliacao nao encontrada");

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { reply, replyAt: new Date() },
    });
  }

  async uploadPhoto(data: {
    clientId: string;
    appointmentId?: string;
    type: string;
    url: string;
    thumbnailUrl?: string;
    description?: string;
  }) {
    return this.prisma.clientPhoto.create({ data });
  }

  async getClientPhotos(clientId: string) {
    return this.prisma.clientPhoto.findMany({
      where: { clientId },
      orderBy: { takenAt: "desc" },
    });
  }
}