import { Injectable } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import {
  InMemoryDatabaseService,
  ServiceRecord,
} from "../../infrastructure/database/in-memory-database.service";
import { ServiceEntity } from "./services.entity";
import { ServicesRepository } from "./services.repository";

@Injectable()
export class ServicesInMemoryRepository implements ServicesRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async findManyByUserId(userId: string): Promise<ServiceEntity[]> {
    return this.db.services.filter((s) => s.userId === userId);
  }

  async findById(id: string): Promise<ServiceEntity | null> {
    return this.db.services.find((s) => s.id === id) ?? null;
  }

  async create(
    userId: string,
    input: { name: string; duration: number; price: number },
  ): Promise<ServiceEntity> {
    const record: ServiceRecord = {
      id: makeId(),
      userId,
      name: input.name,
      duration: input.duration,
      price: input.price,
      createdAt: new Date(),
    };
    this.db.services.push(record);
    return record;
  }

  async update(
    id: string,
    userId: string,
    input: { name?: string; duration?: number; price?: number },
  ): Promise<ServiceEntity | null> {
    const idx = this.db.services.findIndex(
      (s) => s.id === id && s.userId === userId,
    );
    if (idx < 0) return null;
    this.db.services[idx] = { ...this.db.services[idx], ...input };
    return this.db.services[idx];
  }

  async delete(id: string, userId: string): Promise<void> {
    this.db.services = this.db.services.filter(
      (s) => !(s.id === id && s.userId === userId),
    );
  }
}
