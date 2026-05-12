import { Global, MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { LoggingService } from "./logging.service";
import { RequestContext } from "./request-context";
import { RequestContextMiddleware } from "./request-context.middleware";
import { HttpLoggingInterceptor } from "./http-logging.interceptor";

@Global()
@Module({
  providers: [LoggingService, RequestContext, HttpLoggingInterceptor],
  exports: [LoggingService, RequestContext, HttpLoggingInterceptor],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
