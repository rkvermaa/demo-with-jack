import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Global ValidationPipe — rejects requests with invalid DTOs with HTTP 400.
  // whitelist: true strips properties not declared in the DTO.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`Application listening on port ${port}`);
}

void bootstrap();
