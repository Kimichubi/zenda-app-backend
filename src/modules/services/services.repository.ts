import { ServiceEntity } from "./services.entity";

export abstract class ServicesRepository {
  abstract findManyByUserId(userId: string): Promise<ServiceEntity[]>;
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
