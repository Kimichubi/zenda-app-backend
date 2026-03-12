import { Injectable } from "@nestjs/common";
import { ServicesRepository } from "./services.repository";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) { }

  findAll(userId: string) {
    return this.servicesRepository.findManyByUserId(userId);
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
