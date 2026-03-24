import { Injectable } from "@nestjs/common";
import { ServicesRepository } from "./services.repository";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { FindServicesDto } from "./dto/find-services.dto";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";
import { ServiceEntity } from "./services.entity";

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) { }

  async findAll(
    userId: string,
    query: FindServicesDto = {},
  ): Promise<PaginatedResponse<ServiceEntity>> {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.servicesRepository.findManyByUserId(
      userId,
      query,
    );
    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.servicesRepository.findById(id);
  }

  create(userId: string, dto: CreateServiceDto) {
    return this.servicesRepository.create(userId, dto);
  }

  update(userId: string, id: string, dto: UpdateServiceDto) {
    return this.servicesRepository.update(id, userId, dto);
  }

  remove(userId: string, id: string) {
    return this.servicesRepository.delete(id, userId);
  }
}
