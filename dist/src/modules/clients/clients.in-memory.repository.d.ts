import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { ClientEntity } from "./clients.entity";
import { ClientsRepository } from "./clients.repository";
export declare class ClientsInMemoryRepository implements ClientsRepository {
    private readonly db;
    constructor(db: InMemoryDatabaseService);
    findManyByUserId(userId: string): Promise<ClientEntity[]>;
    findByEmailAndUserId(email: string, userId: string): Promise<ClientEntity | null>;
    create(userId: string, input: {
        name: string;
        phone: string;
        email?: string;
    }): Promise<ClientEntity>;
    update(id: string, userId: string, input: {
        name?: string;
        phone?: string;
        email?: string;
    }): Promise<ClientEntity | null>;
    delete(id: string, userId: string): Promise<void>;
}
