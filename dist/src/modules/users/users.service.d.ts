import { UsersRepository } from "./users.repository";
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    me(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        createdAt: Date;
    }>;
}
