import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException("Acesso restrito ao administrador da plataforma");
    }

    const userEntity = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userEntity || userEntity.role !== "PLATFORM_ADMIN") {
      throw new ForbiddenException("Acesso restrito ao administrador da plataforma");
    }

    return true;
  }
}
