import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { UsersRepository } from "../../modules/users/users.repository";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersRepository: UsersRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return false;
    }

    const userEntity = await this.usersRepository.findById(user.id);
    
    if (!userEntity || userEntity.role !== "ADMIN") {
      throw new ForbiddenException("Acesso restrito ao administrador");
    }

    return true;
  }
}
