import { ConflictException, Injectable } from "@nestjs/common";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { ClientsRepository } from "./clients.repository";
import { FindClientsDto } from "./dto/find-clients.dto";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";
import { ClientEntity } from "./clients.entity";

@Injectable()
export class ClientsService {
  constructor(private readonly clientsRepository: ClientsRepository) {}

  async findAll(
    businessId: string,
    dto: FindClientsDto = {},
  ): Promise<PaginatedResponse<ClientEntity>> {
    const { page = 1, limit = 10 } = dto;
    const result = await this.clientsRepository.findManyByBusinessId(businessId, dto);

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
    };
  }

  async create(businessId: string, dto: CreateClientDto) {
    if (dto.email) {
      const existing = await this.clientsRepository.findByEmailAndBusinessId(
        dto.email,
        businessId,
      );
      if (existing) {
        throw new ConflictException("Client email already exists");
      }
    }

    return this.clientsRepository.create(businessId, dto);
  }

  update(businessId: string, id: string, dto: UpdateClientDto) {
    return this.clientsRepository.update(id, businessId, dto);
  }

  remove(businessId: string, id: string) {
    return this.clientsRepository.delete(id, businessId);
  }
}
