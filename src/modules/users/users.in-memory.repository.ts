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
      ...input,
      role: "USER",
      plan: "ONBOARDING",
      createdAt: new Date(),
    };
    this.db.users.push(record);
    return record as any as UserEntity;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = this.db.users.find((u) => u.email === email);
    return (user as any as UserEntity) || null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = this.db.users.find((u) => u.id === id);
    return (user as any as UserEntity) || null;
  }

  async findBySlug(slug: string): Promise<UserEntity | null> {
    const user = this.db.users.find((u) => u.slug === slug);
    return (user as any as UserEntity) || null;
  }

  async findAll(): Promise<UserEntity[]> {
    return this.db.users as any as UserEntity[];
  }

  async update(
    id: string,
    input: { name?: string; phone?: string; businessName?: string; slug?: string; role?: any; plan?: any },
  ): Promise<UserEntity | null> {
    const index = this.db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    this.db.users[index] = {
      ...this.db.users[index],
      ...input,
    };

    return this.db.users[index] as any as UserEntity;
  }
}
