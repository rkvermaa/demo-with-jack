import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from './jwt.strategy';
import { Role } from './roles.enum';

/**
 * OperatorScopeGuard — ensures OPERATOR_ADMIN users can only access resources
 * belonging to their own operator account.
 *
 * Rules:
 *  1. ADMIN passes through unconditionally.
 *  2. OPERATOR_ADMIN: compare request.user.operatorId against the operatorId
 *     found in route params, query params, or request body. Mismatch → 403.
 *  3. All other roles pass through (RolesGuard already blocked unauthorised roles).
 *
 * No database call is made; operatorId is read exclusively from the JWT payload.
 */
@Injectable()
export class OperatorScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException('No user context');
    }

    // ADMIN bypasses operator scoping.
    if (user.role === Role.ADMIN) {
      return true;
    }

    if (user.role === Role.OPERATOR_ADMIN) {
      const resourceOperatorId = this.extractOperatorId(request);

      // If no operatorId is present in the request, allow through
      // (the route may not be operator-scoped).
      if (resourceOperatorId === undefined) {
        return true;
      }

      if (user.operatorId !== resourceOperatorId) {
        throw new ForbiddenException('Operator scope violation');
      }
    }

    return true;
  }

  /**
   * Extracts the operatorId from route params, query params, or request body.
   * Returns undefined if not found.
   */
  private extractOperatorId(request: Request): string | undefined {
    const params = request.params as Record<string, string>;
    const query = request.query as Record<string, string>;
    const body = request.body as Record<string, unknown> | undefined;

    return (
      params['operatorId'] ??
      query['operatorId'] ??
      (body && typeof body['operatorId'] === 'string'
        ? body['operatorId']
        : undefined)
    );
  }
}
