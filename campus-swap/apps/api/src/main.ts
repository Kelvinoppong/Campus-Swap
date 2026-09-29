import 'reflect-metadata';

import { API_PREFIX } from '@campus-swap/shared';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ENV, type Env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const env = app.get<Env>(ENV);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.enableCors({
    origin: env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS,
    credentials: true,
  });

  // Versioned from day one: /v1/listings, /v1/auth/verify-code, and so on.
  // `/health` sits outside the prefix so platform checks stay stable across versions.
  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`API listening on http://localhost:${env.PORT}/${API_PREFIX}`);
}

void bootstrap();
