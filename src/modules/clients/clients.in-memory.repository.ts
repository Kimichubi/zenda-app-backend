import { Injectable } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import {
  ClientRecord,
  InMemoryDatabaseService,
} from "../../infrastructure/database/in-memory-database.service";
import { ClientEntity } from "./clients.entity";
import { ClientsRepository } from "./clients.repository";

@Injectable()
export class ClientsInMemoryRepository implements ClientsRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async findManyByUserId(userId: string): Promise<ClientEntity[]> {
    return this.db.clients.filter((client) => client.userId === userId);
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
