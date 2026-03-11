import { UserEntity } from "./users.entity";
export declare abstract class UsersRepository {
    abstract create(input: {
        name: string;
        email: string;
        passwordHash: string;
    }): Promise<UserEntity>;
    abstract findByEmail(email: string): Promise<UserEntity | null>;
    abstract findById(id: string): Promise<UserEntity | null>;
}
