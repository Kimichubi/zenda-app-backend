import { Injectable } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import {
  InMemoryDatabaseService,
  UserRecord,
} from "../../infrastructure/database/in-memory-database.service";
import { UserEntity } from "./users.entity";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersInMemoryRepository implements UsersRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
    businessName: string;
    slug: string;
  }): Promise<UserEntity> {
    const record: UserRecord = {
      id: makeId(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      phone: input.phone,
      businessName: input.businessName,
      slug: input.slug,
      createdAt: new Date(),
    };
    this.db.users.push(record);
    return record;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.db.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.db.users.find((u) => u.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<UserEntity | null> {
    return this.db.users.find((u) => u.slug === slug) ?? null;
  }

  async update(
    id: string,
    input: { name?: string; phone?: string; businessName?: string; slug?: string },
  ): Promise<UserEntity | null> {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    this.db.users[idx] = { ...this.db.users[idx], ...input };
    return this.db.users[idx];
  }
}
