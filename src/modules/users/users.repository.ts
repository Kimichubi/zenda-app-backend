import { UserEntity } from "./users.entity";

export abstract class UsersRepository {
  abstract create(input: {
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
  }): Promise<UserEntity>;

  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findAll(): Promise<UserEntity[]>;
  abstract findByBusinessId(businessId: string): Promise<UserEntity[]>;
  abstract update(
    id: string,
    input: {
      name?: string;
      phone?: string;
      businessId?: string | null;
      role?: string;
      baseCommission?: number;
    },
  ): Promise<UserEntity | null>;
}
