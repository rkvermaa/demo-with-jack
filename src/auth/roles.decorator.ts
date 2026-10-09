import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.enum';

/**
 * Metadata key used by RolesGuard to read required roles from handler/controller metadata.
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles(...roles) decorator — declare which roles are permitted to access a route.
 *
 * Usage:
 *   @Roles(Role.ADMIN)
 *   @Get('/admin/users')
 *   getUsers() { ... }
 *
 * The guard reads this metadata; no role logic lives inside the guard itself.
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
