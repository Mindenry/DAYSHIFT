import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware";
import { originCheckMiddleware } from "./common/middleware/origin-check.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false, bodyParser: false });
  const config = app.get(ConfigService);
  const port = Number(config.get("PORT") ?? 4000);
  const isProd = config.get("NODE_ENV") === "production";

  app.use(
    json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        (req as typeof req & { rawBody?: string }).rawBody = buf.toString("utf8");
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: "1mb" }));

  app.setGlobalPrefix("api/v1");
  app.use(requestIdMiddleware);
  app.use(originCheckMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const allowedOrigins = [
    config.get<string>("APP_URL") ?? "http://localhost:3000",
    config.get<string>("ADMIN_URL") ?? "http://localhost:3001",
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-Idempotency-Key"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 86400,
  });

  app.enableShutdownHooks();

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("DAYSHIFT Commerce API")
      .setDescription(
        "REST API for the DAYSHIFT storefront, admin portal and background operations. All money values are decimal strings in the store currency.",
      )
      .setVersion("1.0.0")
      .addCookieAuth("ds_session", { type: "apiKey", in: "cookie" })
      .addTag("catalog")
      .addTag("cart")
      .addTag("checkout")
      .addTag("orders")
      .addTag("admin")
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port, "0.0.0.0");
  Logger.log(`DAYSHIFT API listening on http://localhost:${port}/api/v1`, "Bootstrap");
}

void bootstrap();
