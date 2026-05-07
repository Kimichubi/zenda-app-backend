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

  async findManyByBusinessId(
    businessId: string,
    query: FindClientsDto,
  ): Promise<{ data: ClientEntity[]; total: number }> {
    const { search, startDate, endDate, page = 1, limit = 10, status } = query;

    let filtered = this.db.clients.filter((client) => client.businessId === businessId);

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

    if (status) {
      filtered = filtered.filter((client) => client.status === status);
    }

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const data = filtered.slice(skip, skip + limit);

    return { data, total };
  }

  async findByEmailAndBusinessId(
    email: string,
    businessId: string,
  ): Promise<ClientEntity | null> {
    return (
      this.db.clients.find(
        (client) => client.businessId === businessId && client.email === email,
      ) ?? null
    );
  }

  async findByPhoneAndBusinessId(
    phone: string,
    businessId: string,
  ): Promise<ClientEntity | null> {
    return (
      this.db.clients.find(
        (client) => client.businessId === businessId && client.phone === phone,
      ) ?? null
    );
  }

  async findById(id: string): Promise<ClientEntity | null> {
    return this.db.clients.find((client) => client.id === id) ?? null;
  }

  async create(
    businessId: string,
    input: { name: string; phone: string; email?: string; notes?: string },
  ): Promise<ClientEntity> {
    const record: ClientRecord = {
      id: makeId(),
      businessId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      notes: input.notes ?? null,
      status: "ACTIVE",
      createdAt: new Date(),
    };

    this.db.clients.push(record);
    return record;
  }

  async update(
    id: string,
    businessId: string,
    input: { name?: string; phone?: string; email?: string; notes?: string },
  ): Promise<ClientEntity | null> {
    const index = this.db.clients.findIndex(
      (client) => client.id === id && client.businessId === businessId,
    );
    if (index < 0) {
      return null;
    }

    this.db.clients[index] = {
      ...this.db.clients[index],
      ...input,
      email: input.email === undefined ? this.db.clients[index].email : input.email,
    };
    return this.db.clients[index];
  }

  async delete(id: string, businessId: string): Promise<void> {
    this.db.clients = this.db.clients.filter(
      (client) => !(client.id === id && client.businessId === businessId),
    );
  }
}
