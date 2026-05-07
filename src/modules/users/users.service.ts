import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) { }

  async me(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessId: user.businessId,
      baseCommission: user.baseCommission,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    input: {
      name?: string;
      phone?: string;
    },
  ) {
    const user = await this.usersRepository.update(userId, input);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessId: user.businessId,
      baseCommission: user.baseCommission,
      createdAt: user.createdAt,
    };
  }
}
