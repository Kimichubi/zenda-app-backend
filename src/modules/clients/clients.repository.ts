import { ClientEntity } from "./clients.entity";

export abstract class ClientsRepository {
  abstract findManyByUserId(userId: string): Promise<ClientEntity[]>;
  abstract findByEmailAndUserId(
    email: string,
    userId: string,
  ): Promise<ClientEntity | null>;
  abstract create(
    userId: string,
    input: { name: string; phone: string; email?: string },
  ): Promise<ClientEntity>;
  abstract update(
    id: string,
    userId: string,
    input: { name?: string; phone?: string; email?: string },
  ): Promise<ClientEntity | null>;
  abstract delete(id: string, userId: string): Promise<void>;
}
