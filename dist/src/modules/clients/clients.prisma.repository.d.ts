import { PrismaService } from "../../infrastructure/database/prisma.service";
import { ClientEntity } from "./clients.entity";
import { ClientsRepository } from "./clients.repository";
export declare class ClientsPrismaRepository implements ClientsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
