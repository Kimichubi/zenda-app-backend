import { ClientEntity } from "./clients.entity";
import { FindClientsDto } from "./dto/find-clients.dto";

export abstract class ClientsRepository {
  abstract findManyByUserId(
    userId: string,
    query: FindClientsDto,
  ): Promise<{ data: ClientEntity[]; total: number }>;
  abstract findByEmailAndUserId(
    email: string,
    userId: string,
  ): Promise<ClientEntity | null>;
  abstract findByPhoneAndUserId(
    phone: string,
    userId: string,
  ): Promise<ClientEntity | null>;
  abstract findById(id: string): Promise<ClientEntity | null>;
  abstract create(
    userId: string,
    input: { name: string; phone: string; email?: string; notes?: string },
  ): Promise<ClientEntity>;
  abstract update(
    id: string,
    userId: string,
    input: { name?: string; phone?: string; email?: string; notes?: string },
  ): Promise<ClientEntity | null>;
  abstract delete(id: string, userId: string): Promise<void>;
}
