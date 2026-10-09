import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by JwtAuthGuard to skip JWT verification on public routes.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() decorator — marks a route as publicly accessible (no JWT required).
 *
 * Usage:
 *   @Public()
 *   @Get('/health')
 *   healthCheck() { ... }
 *
 * WARNING: Any route that omits @Public() is protected by default.
 * Always add @Public() explicitly to login, registration, and health endpoints.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
