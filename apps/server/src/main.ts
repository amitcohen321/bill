import 'reflect-metadata';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/global-http-exception.filter';
import { Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const publicDir = join(__dirname, '..', '..', '..', '..', '..', '..', 'apps', 'web', 'dist');
  app.useStaticAssets(publicDir);

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // SPA fallback: serve index.html for all non-API routes
  const indexPath = join(publicDir, 'index.html');
  let indexHtml = '';
  if (existsSync(indexPath)) {
    indexHtml = readFileSync(indexPath, 'utf-8');
    Logger.log(`SPA fallback loaded from ${indexPath}`, 'Bootstrap');
  } else {
    Logger.warn(`index.html not found at ${indexPath} — SPA fallback disabled`, 'Bootstrap');
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      next();
    } else if (indexHtml) {
      res.type('html').send(indexHtml);
    } else {
      next();
    }
  });

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
  Logger.log(`Server running on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
