import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { FixturesModule } from './fixtures/fixtures.module';

/**
 * AppModule — root module.
 *
 * Global guard order (NestJS applies them in registration order):
 *  1. JwtAuthGuard  — handles 401 for missing/invalid tokens (skips @Public routes)
 *  2. RolesGuard    — handles 403 for insufficient role
 *
 * Every route is protected by default. Use @Public() to opt out of JWT verification.
 * Use @Roles(...) to declare required roles on a handler or controller.
 */
@Module({
  imports: [AuthModule, FixturesModule],
  providers: [
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
