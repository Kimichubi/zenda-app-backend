import { Injectable } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import {
  InMemoryDatabaseService,
  ServiceRecord,
} from "../../infrastructure/database/in-memory-database.service";
import { ServiceEntity } from "./services.entity";
import { ServicesRepository } from "./services.repository";
import { FindServicesDto } from "./dto/find-services.dto";

@Injectable()
export class ServicesInMemoryRepository implements ServicesRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async findManyByBusinessId(
    businessId: string,
    query: FindServicesDto = {},
  ): Promise<{ data: ServiceEntity[]; total: number }> {
    const { search, minPrice, maxPrice, page = 1, limit = 10 } = query;

    let filtered = this.db.services.filter((s) => s.businessId === businessId);

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(s));
    }

    if (minPrice !== undefined) {
      filtered = filtered.filter((item) => item.price >= minPrice);
    }

    if (maxPrice !== undefined) {
      filtered = filtered.filter((item) => item.price <= maxPrice);
    }

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const data = filtered.slice(skip, skip + limit);

    return { data, total };
  }

  async findById(id: string): Promise<ServiceEntity | null> {
    return this.db.services.find((s) => s.id === id) ?? null;
  }

  async create(
    businessId: string,
    input: { name: string; duration: number; price: number },
  ): Promise<ServiceEntity> {
    const record: ServiceRecord = {
      id: makeId(),
      businessId,
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
    businessId: string,
    input: { name?: string; duration?: number; price?: number },
  ): Promise<ServiceEntity | null> {
    const idx = this.db.services.findIndex(
      (s) => s.id === id && s.businessId === businessId,
    );
    if (idx < 0) return null;
    this.db.services[idx] = { ...this.db.services[idx], ...input };
    return this.db.services[idx];
  }

  async delete(id: string, businessId: string): Promise<void> {
    this.db.services = this.db.services.filter(
      (s) => !(s.id === id && s.businessId === businessId),
    );
  }
}
