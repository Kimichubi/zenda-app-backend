import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.email) {
      throw new ForbiddenException("Acesso restrito ao administrador da plataforma");
    }

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email: user.email },
    });

    if (!admin) {
      throw new ForbiddenException("Acesso restrito ao administrador da plataforma");
    }

    return true;
  }
}
