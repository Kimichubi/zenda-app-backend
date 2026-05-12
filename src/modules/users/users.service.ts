import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) { }

  async me(userId: string, requestContext?: { isImpersonating?: boolean; impersonatedBusinessId?: string | null; businessId?: string | null }) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isImpersonating = requestContext?.isImpersonating ?? false;
    const effectiveBusinessId = requestContext?.businessId ?? user.businessId ?? null;

    let business: { name: string; slug: string; pixKey: string | null } | null = null;
    let impersonatedBusiness: { name: string; slug: string; pixKey: string | null } | null = null;

    if (effectiveBusinessId) {
      business = await this.prisma.business.findUnique({
        where: { id: effectiveBusinessId },
        select: { name: true, slug: true, pixKey: true },
      });
    }

    if (isImpersonating && requestContext?.impersonatedBusinessId) {
      impersonatedBusiness = await this.prisma.business.findUnique({
        where: { id: requestContext.impersonatedBusinessId },
        select: { name: true, slug: true, pixKey: true },
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      instagramUrl: user.instagramUrl,
      role: user.role,
      businessId: effectiveBusinessId,
      baseCommission: user.baseCommission,
      businessName: business?.name ?? null,
      slug: business?.slug ?? null,
      pixKey: business?.pixKey ?? null,
      isImpersonating,
      impersonatedBusinessId: requestContext?.impersonatedBusinessId ?? null,
      impersonatedBusinessName: impersonatedBusiness?.name ?? null,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    input: {
      name?: string;
      phone?: string;
      bio?: string;
      instagramUrl?: string;
      businessName?: string;
      slug?: string;
      pixKey?: string;
    },
  ) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const userData: { name?: string; phone?: string; bio?: string; instagramUrl?: string } = {};
    if (input.name !== undefined) userData.name = input.name;
    if (input.phone !== undefined) userData.phone = input.phone;
    if (input.bio !== undefined) userData.bio = input.bio;
    if (input.instagramUrl !== undefined) userData.instagramUrl = input.instagramUrl;

    if (Object.keys(userData).length > 0) {
      await this.usersRepository.update(userId, userData);
    }

    if (user.businessId && (input.businessName !== undefined || input.slug !== undefined || input.pixKey !== undefined)) {
      const businessData: { name?: string; slug?: string; pixKey?: string | null } = {};
      if (input.businessName !== undefined) businessData.name = input.businessName;
      if (input.slug !== undefined) businessData.slug = input.slug;
      if (input.pixKey !== undefined) businessData.pixKey = input.pixKey || null;

      await this.prisma.business.update({
        where: { id: user.businessId },
        data: businessData,
      });
    }

    return this.me(userId);
  }
}
