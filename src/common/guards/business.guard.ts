import { CanActivate, ExecutionContext, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class BusinessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.businessId) {
      throw new BadRequestException("Nenhum negocio associado a este usuario. Complete o onboarding.");
    }

    return true;
  }
}
