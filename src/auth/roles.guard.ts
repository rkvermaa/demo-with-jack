import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './roles.enum';
import { JwtPayload } from './jwt.strategy';

/**
 * RolesGuard — enforces role-based access control.
 *
 * Rules:
 *  1. If no @Roles() metadata is present on the handler/class, allow through
 *     (JwtAuthGuard already enforced authentication).
 *  2. Read request.user.role from the JWT payload — NO database call.
 *  3. If the role value is not a member of the Role enum, throw 403 (tampered token).
 *  4. ADMIN is the highest privilege; an ADMIN user passes any role check.
 *  5. Otherwise, the user's role must appear in the required roles array.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No role metadata → route is accessible to any authenticated user.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    // Should not happen (JwtAuthGuard runs first), but guard defensively.
    if (!user) {
      throw new ForbiddenException('No user context');
    }

    // AC8: Reject role values not present in the canonical enum.
    const validRoles = Object.values(Role) as string[];
    if (!validRoles.includes(user.role)) {
      throw new ForbiddenException('Invalid role claim');
    }

    // F1: PUBLIC is a conceptual label for unauthenticated access only.
    // A JWT carrying role=PUBLIC must never be granted access to any
    // authenticated route, regardless of @Roles metadata.
    if (user.role === Role.PUBLIC) {
      throw new ForbiddenException('PUBLIC role cannot access authenticated routes');
    }

    // AC5: ADMIN is a superset — passes every role check.
    if (user.role === Role.ADMIN) {
      return true;
    }

    // AC3 / AC4: User's role must be in the required roles list.
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
