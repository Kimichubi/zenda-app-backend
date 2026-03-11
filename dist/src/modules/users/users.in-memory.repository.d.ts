import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { UserEntity } from "./users.entity";
import { UsersRepository } from "./users.repository";
export declare class UsersInMemoryRepository implements UsersRepository {
    private readonly db;
    constructor(db: InMemoryDatabaseService);
    create(input: {
        name: string;
        email: string;
        passwordHash: string;
    }): Promise<UserEntity>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: string): Promise<UserEntity | null>;
}
