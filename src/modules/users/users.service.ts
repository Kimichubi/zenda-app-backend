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
      businessName: user.businessName,
      slug: user.slug,
      role: user.role,
      plan: user.plan,
      pixKeyType: user.pixKeyType,
      pixKey: user.pixKey,
      pixName: user.pixName,
      pixCity: user.pixCity,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    input: { 
      name?: string; 
      phone?: string; 
      businessName?: string; 
      slug?: string;
      pixKeyType?: string;
      pixKey?: string;
      pixName?: string;
      pixCity?: string;
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
      businessName: user.businessName,
      slug: user.slug,
      role: user.role,
      plan: user.plan,
      pixKeyType: user.pixKeyType,
      pixKey: user.pixKey,
      pixName: user.pixName,
      pixCity: user.pixCity,
      createdAt: user.createdAt,
    };
  }
}
