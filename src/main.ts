import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import "dotenv/config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const frontendOrigin = configService.get("FRONTEND_URL") || "http://localhost:5174";

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xContentTypeOptions: true,
    xDnsPrefetchControl: { allow: false },
    xDownloadOptions: true,
    xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
  }));

  app.enableCors({
    origin: process.env.NODE_ENV === "production"
      ? [frontendOrigin]
      : [frontendOrigin, "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,Accept",
    maxAge: 86400,
  });

  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix("", { exclude: [] });

  await app.listen(configService.get("PORT") ?? 3001);
}
bootstrap();
