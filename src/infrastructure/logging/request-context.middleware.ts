import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RequestContext } from "./request-context";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContext) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const reqWithUser = req as unknown as {
      user?: { id?: string; email?: string; businessId?: string };
    };

    const context = this.requestContext.createContext({
      userId: reqWithUser.user?.id,
      userEmail: reqWithUser.user?.email,
      businessId: reqWithUser.user?.businessId,
    });

    this.requestContext.run(context, () => {
      req.headers["x-correlation-id"] = context.correlationId;
      res.setHeader("X-Correlation-Id", context.correlationId);
      next();
    });
  }
}
