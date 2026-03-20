import { ConflictException, Injectable } from "@nestjs/common";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { ClientsRepository } from "./clients.repository";

@Injectable()
export class ClientsService {
  constructor(private readonly clientsRepository: ClientsRepository) {}

  async findAll(userId: string) {
    const result = await this.clientsRepository.findManyByUserId(userId, {});
    return result.data;
  }

  async create(userId: string, dto: CreateClientDto) {
    if (dto.email) {
      const existing = await this.clientsRepository.findByEmailAndUserId(
        dto.email,
        userId,
      );
      if (existing) {
        throw new ConflictException("Client email already exists");
      }
    }

    return this.clientsRepository.create(userId, dto);
  }

  update(userId: string, id: string, dto: UpdateClientDto) {
    return this.clientsRepository.update(id, userId, dto);
  }

  remove(userId: string, id: string) {
    return this.clientsRepository.delete(id, userId);
  }
}
