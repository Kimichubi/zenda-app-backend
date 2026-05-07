import { ServiceEntity } from "./services.entity";
import { FindServicesDto } from "./dto/find-services.dto";

export abstract class ServicesRepository {
  abstract findManyByBusinessId(
    businessId: string,
    query?: FindServicesDto,
  ): Promise<{ data: ServiceEntity[]; total: number }>;
  abstract findById(id: string): Promise<ServiceEntity | null>;
  abstract create(
    businessId: string,
    input: { name: string; duration: number; price: number },
  ): Promise<ServiceEntity>;
  abstract update(
    id: string,
    businessId: string,
    input: { name?: string; duration?: number; price?: number },
  ): Promise<ServiceEntity | null>;
  abstract delete(id: string, businessId: string): Promise<void>;
}
