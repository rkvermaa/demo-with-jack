import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // ValidationPipe is registered as APP_PIPE in AppModule so it is active
  // in every bootstrap context without an imperative call here.

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`Application listening on port ${port}`);
}

void bootstrap();
