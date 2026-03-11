import { PrismaService } from "../../infrastructure/database/prisma.service";
import { UserEntity } from "./users.entity";
import { UsersRepository } from "./users.repository";
export declare class UsersPrismaRepository implements UsersRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: {
        name: string;
        email: string;
        passwordHash: string;
    }): Promise<UserEntity>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: string): Promise<UserEntity | null>;
}
