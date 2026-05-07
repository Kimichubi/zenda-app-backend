import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { UserEntity } from "./users.entity";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
  }): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        phone: input.phone ?? "",
        role: "PROFESSIONAL",
      },
    });
    return user as UserEntity;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user as UserEntity | null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user as UserEntity | null;
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { business: { select: { id: true, name: true, slug: true, plan: true, status: true } } },
    });
    return users as UserEntity[];
  }

  async findByBusinessId(businessId: string): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });
    return users as UserEntity[];
  }

  async update(
    id: string,
    input: {
      name?: string;
      phone?: string;
      businessId?: string | null;
      role?: string;
      baseCommission?: number;
    },
  ): Promise<UserEntity | null> {
    const user = await this.prisma.user.update({
      where: { id },
      data: input as any,
    });
    return user as UserEntity | null;
  }
}
