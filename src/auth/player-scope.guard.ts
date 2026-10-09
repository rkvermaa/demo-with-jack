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
 * PlayerScopeGuard — ensures PLAYER users can only access their own resources.
 *
 * Rules:
 *  1. ADMIN and OPERATOR_ADMIN pass through unconditionally.
 *  2. PLAYER: compare request.user.sub against the :playerId route param.
 *     Mismatch → 403.
 *
 * No database call is made; the player ID is read exclusively from the JWT payload.
 */
@Injectable()
export class PlayerScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException('No user context');
    }

    // ADMIN and OPERATOR_ADMIN bypass player scoping.
    if (user.role === Role.ADMIN || user.role === Role.OPERATOR_ADMIN) {
      return true;
    }

    if (user.role === Role.PLAYER) {
      const params = request.params as Record<string, string>;
      const resourcePlayerId = params['playerId'];

      // If no playerId param, allow through (route may not be player-scoped).
      if (resourcePlayerId === undefined) {
        return true;
      }

      if (user.sub !== resourcePlayerId) {
        throw new ForbiddenException('Player scope violation');
      }
    }

    return true;
  }
}
