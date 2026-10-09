import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PlayerScopeGuard } from './player-scope.guard';
import { Role } from './roles.enum';

function buildContext(
  role: string,
  sub: string,
  playerId?: string,
): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { role, sub },
        params: playerId !== undefined ? { playerId } : {},
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('PlayerScopeGuard', () => {
  let guard: PlayerScopeGuard;

  beforeEach(() => {
    guard = new PlayerScopeGuard();
  });

  // (a) ADMIN passes regardless of playerId mismatch.
  it('should allow ADMIN even when playerId mismatches', () => {
    const ctx = buildContext(Role.ADMIN, 'adminUser', 'playerX');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // OPERATOR_ADMIN passes regardless of playerId.
  it('should allow OPERATOR_ADMIN even when playerId mismatches', () => {
    const ctx = buildContext(Role.OPERATOR_ADMIN, 'opAdmin', 'playerX');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // (b) PLAYER with matching sub passes.
  it('should allow PLAYER when sub matches playerId', () => {
    const ctx = buildContext(Role.PLAYER, 'playerX', 'playerX');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // (c) PLAYER with mismatched sub throws 403.
  it('should throw ForbiddenException when PLAYER sub mismatches playerId', () => {
    const ctx = buildContext(Role.PLAYER, 'playerX', 'playerY');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // PLAYER with no playerId param passes (route not scoped).
  it('should allow PLAYER when no playerId param is present', () => {
    const ctx = buildContext(Role.PLAYER, 'playerX', undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // No user → ForbiddenException.
  it('should throw ForbiddenException when no user is present', () => {
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: undefined, params: {} }),
      }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
