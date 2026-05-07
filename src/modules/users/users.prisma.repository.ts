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
    businessName: string;
    slug: string;
  }): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        ...input,
        role: "USER",
        plan: "ONBOARDING",
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

  async findBySlug(slug: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { slug } });
    return user as UserEntity | null;
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users as UserEntity[];
  }

  async update(
    id: string,
    input: { name?: string; phone?: string; businessName?: string; slug?: string; role?: any; plan?: any },
  ): Promise<UserEntity | null> {
    const user = await this.prisma.user.update({
      where: { id },
      data: input,
    });
    return user as UserEntity | null;
  }
}
