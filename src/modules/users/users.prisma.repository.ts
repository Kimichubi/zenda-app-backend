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
    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        phone: input.phone,
        businessName: input.businessName,
        slug: input.slug,
      },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { slug } });
  }

  async update(
    id: string,
    input: { name?: string; phone?: string; businessName?: string; slug?: string },
  ): Promise<UserEntity | null> {
    return this.prisma.user.update({ where: { id }, data: input });
  }
}
