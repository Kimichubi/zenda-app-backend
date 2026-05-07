import { ClientEntity } from "./clients.entity";
import { FindClientsDto } from "./dto/find-clients.dto";

export abstract class ClientsRepository {
  abstract findManyByBusinessId(
    businessId: string,
    query: FindClientsDto,
  ): Promise<{ data: ClientEntity[]; total: number }>;
  abstract findByEmailAndBusinessId(
    email: string,
    businessId: string,
  ): Promise<ClientEntity | null>;
  abstract findByPhoneAndBusinessId(
    phone: string,
    businessId: string,
  ): Promise<ClientEntity | null>;
  abstract findById(id: string): Promise<ClientEntity | null>;
  abstract create(
    businessId: string,
    input: { name: string; phone: string; email?: string; notes?: string },
  ): Promise<ClientEntity>;
  abstract update(
    id: string,
    businessId: string,
    input: { name?: string; phone?: string; email?: string; notes?: string },
  ): Promise<ClientEntity | null>;
  abstract delete(id: string, businessId: string): Promise<void>;
}
