import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { ClientEntity } from "./clients.entity";
import { ClientsRepository } from "./clients.repository";

@Injectable()
export class ClientsPrismaRepository implements ClientsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findManyByUserId(userId: string): Promise<ClientEntity[]> {
    return this.prisma.client.findMany({ where: { userId } });
  }

  async findByEmailAndUserId(
    email: string,
    userId: string,
  ): Promise<ClientEntity | null> {
    return this.prisma.client.findFirst({ where: { email, userId } });
  }

  async findByPhoneAndUserId(
    phone: string,
    userId: string,
  ): Promise<ClientEntity | null> {
    return this.prisma.client.findFirst({ where: { phone, userId } });
  }

  async findById(id: string): Promise<ClientEntity | null> {
    return this.prisma.client.findUnique({ where: { id } });
  }

  async create(
    userId: string,
    input: { name: string; phone: string; email?: string; notes?: string },
  ): Promise<ClientEntity> {
    return this.prisma.client.create({
      data: {
        userId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        notes: input.notes,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    input: { name?: string; phone?: string; email?: string; notes?: string },
  ): Promise<ClientEntity | null> {
    const existing = await this.prisma.client.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return null;
    }

    return this.prisma.client.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.client.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return;
    }

    await this.prisma.client.delete({ where: { id } });
  }
}
