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
  constructor(private readonly db: InMemoryDatabaseService) {}

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    const record: UserRecord = {
      id: makeId(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
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
}
