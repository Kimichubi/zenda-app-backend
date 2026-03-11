import { UsersService } from "./users.service";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    me(user: {
        sub: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        createdAt: Date;
    }>;
}
