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
    businessId: string,
    query: FindServicesDto = {},
  ): Promise<PaginatedResponse<ServiceEntity>> {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.servicesRepository.findManyByBusinessId(
      businessId,
      query,
    );
    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.servicesRepository.findById(id);
  }

  create(businessId: string, dto: CreateServiceDto) {
    return this.servicesRepository.create(businessId, dto);
  }

  update(businessId: string, id: string, dto: UpdateServiceDto) {
    return this.servicesRepository.update(id, businessId, dto);
  }

  remove(businessId: string, id: string) {
    return this.servicesRepository.delete(id, businessId);
  }
}
