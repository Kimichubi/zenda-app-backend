import { ServiceEntity } from "./services.entity";
import { FindServicesDto } from "./dto/find-services.dto";

export abstract class ServicesRepository {
  abstract findManyByUserId(
    userId: string,
    query?: FindServicesDto,
  ): Promise<{ data: ServiceEntity[]; total: number }>;
  abstract findById(id: string): Promise<ServiceEntity | null>;
  abstract create(
    userId: string,
    input: { name: string; duration: number; price: number },
  ): Promise<ServiceEntity>;
  abstract update(
    id: string,
    userId: string,
    input: { name?: string; duration?: number; price?: number },
  ): Promise<ServiceEntity | null>;
  abstract delete(id: string, userId: string): Promise<void>;
}
