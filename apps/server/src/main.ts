import 'reflect-metadata';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/global-http-exception.filter';
import { Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

function resolvePublicDir(): string {
  const candidates = [
    // From cwd (project root on Render: node apps/server/dist/.../main.js)
    join(process.cwd(), 'apps', 'web', 'dist'),
    // From cwd if started from apps/server/ directory
    join(process.cwd(), '..', 'web', 'dist'),
    // From compiled __dirname (apps/server/dist/apps/server/src/) up 6 levels to project root
    join(__dirname, '..', '..', '..', '..', '..', '..', 'apps', 'web', 'dist'),
    // From __dirname with fewer levels (in case nest build output changes)
    join(__dirname, '..', '..', '..', '..', 'apps', 'web', 'dist'),
  ];

  for (const dir of candidates) {
    const indexPath = join(dir, 'index.html');
    if (existsSync(indexPath)) {
      Logger.log(`Found web dist at ${dir}`, 'Bootstrap');
      return dir;
    }
    Logger.warn(`Tried ${dir} — index.html not found`, 'Bootstrap');
  }

  // Fallback to first candidate even if not found
  Logger.error(
    `Web dist NOT found in any candidate path — SPA fallback will be disabled! Candidates tried: ${candidates.join(', ')}`,
    'Bootstrap',
  );
  return candidates[0]!;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  Logger.log(`__dirname: ${__dirname}`, 'Bootstrap');
  Logger.log(`cwd: ${process.cwd()}`, 'Bootstrap');

  const publicDir = resolvePublicDir();
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
    Logger.log(`SPA fallback loaded (${indexHtml.length} bytes)`, 'Bootstrap');
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
