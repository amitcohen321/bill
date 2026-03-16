import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/global-http-exception.filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  app.enableCors({
    origin: process.env['NODE_ENV'] === 'production' ? false : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
  Logger.log(`Server running on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
