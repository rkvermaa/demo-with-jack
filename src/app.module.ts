import { Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { FixturesModule } from './fixtures/fixtures.module';
import { DatabaseModule } from './database/database.module';
import { RegisterModule } from './register/register.module';

/**
 * AppModule — root module.
 *
 * Global guard order (NestJS applies them in registration order):
 *  1. JwtAuthGuard  — handles 401 for missing/invalid tokens (skips @Public routes)
 *  2. RolesGuard    — handles 403 for insufficient role
 *
 * Every route is protected by default. Use @Public() to opt out of JWT verification.
 * Use @Roles(...) to declare required roles on a handler or controller.
 *
 * ValidationPipe is registered here as APP_PIPE so it is part of the DI
 * container and is active in every bootstrap context (production, unit tests,
 * e2e tests) without any caller needing to call useGlobalPipes().
 */
@Module({
  imports: [DatabaseModule, AuthModule, FixturesModule, RegisterModule],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true }),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
