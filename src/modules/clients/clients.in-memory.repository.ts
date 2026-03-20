import { Injectable } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import {
  ClientRecord,
  InMemoryDatabaseService,
} from "../../infrastructure/database/in-memory-database.service";
import { ClientEntity } from "./clients.entity";
import { ClientsRepository } from "./clients.repository";
import { FindClientsDto } from "./dto/find-clients.dto";

@Injectable()
export class ClientsInMemoryRepository implements ClientsRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async findManyByUserId(
    userId: string,
    query: FindClientsDto,
  ): Promise<{ data: ClientEntity[]; total: number }> {
    const { search, startDate, endDate, page = 1, limit = 10, status } = query;

    let filtered = this.db.clients.filter((client) => client.userId === userId);

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(lowerSearch) ||
          client.phone.includes(lowerSearch) ||
          (client.email && client.email.toLowerCase().includes(lowerSearch)),
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((client) => client.createdAt >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter((client) => client.createdAt <= end);
    }

    // Note: status is not yet in ClientRecord but is in FindClientsDto
    // If it's added later, we can filter by it here
    // For now, let's assume it might be there or ignore it if not in Entity

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const data = filtered.slice(skip, skip + limit);

    return { data, total };
  }

  async findByEmailAndUserId(
    email: string,
    userId: string,
  ): Promise<ClientEntity | null> {
    return (
      this.db.clients.find(
        (client) => client.userId === userId && client.email === email,
      ) ?? null
    );
  }

  async findByPhoneAndUserId(
    phone: string,
    userId: string,
  ): Promise<ClientEntity | null> {
    return (
      this.db.clients.find(
        (client) => client.userId === userId && client.phone === phone,
      ) ?? null
    );
  }

  async findById(id: string): Promise<ClientEntity | null> {
    return this.db.clients.find((client) => client.id === id) ?? null;
  }

  async create(
    userId: string,
    input: { name: string; phone: string; email?: string; notes?: string },
  ): Promise<ClientEntity> {
    const record: ClientRecord = {
      id: makeId(),
      userId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      notes: input.notes ?? null,
      createdAt: new Date(),
    };

    this.db.clients.push(record);
    return record;
  }

  async update(
    id: string,
    userId: string,
    input: { name?: string; phone?: string; email?: string; notes?: string },
  ): Promise<ClientEntity | null> {
    const index = this.db.clients.findIndex(
      (client) => client.id === id && client.userId === userId,
    );
    if (index < 0) {
      return null;
    }

    this.db.clients[index] = {
      ...this.db.clients[index],
      ...input,
      email:
        input.email === undefined ? this.db.clients[index].email : input.email,
    };
    return this.db.clients[index];
  }

  async delete(id: string, userId: string): Promise<void> {
    this.db.clients = this.db.clients.filter(
      (client) => !(client.id === id && client.userId === userId),
    );
  }
}
