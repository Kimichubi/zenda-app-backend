import { UserEntity } from "./users.entity";

export abstract class UsersRepository {
  abstract create(input: {
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
    businessName: string;
    slug: string;
  }): Promise<UserEntity>;

  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findBySlug(slug: string): Promise<UserEntity | null>;
  abstract update(
    id: string,
    input: { name?: string; phone?: string; businessName?: string; slug?: string },
  ): Promise<UserEntity | null>;
}
