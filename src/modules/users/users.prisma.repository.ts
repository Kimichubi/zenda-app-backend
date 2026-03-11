import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { UserEntity } from "./users.entity";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
