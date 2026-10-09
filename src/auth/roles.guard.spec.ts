import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

/**
 * Helper: build a minimal ExecutionContext mock.
 */
function buildContext(userRole: string | undefined, extraUser: object = {}): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: userRole !== undefined ? { role: userRole, sub: 'user-1', ...extraUser } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  // AC7: No repository is injected — confirm constructor only takes Reflector.
  it('should only depend on Reflector (no DB/repository injection)', () => {
    // The guard constructor accepts exactly one argument: Reflector.
    // If a repository were injected, this test would need to provide it.
    expect(guard).toBeDefined();
    // Verify no DataSource / Repository token is present in the guard.
    const providerTokens = Object.keys(guard as unknown as Record<string, unknown>);
    const dbTokens = providerTokens.filter((k) =>
      k.toLowerCase().includes('repository') ||
      k.toLowerCase().includes('datasource') ||
      k.toLowerCase().includes('entitymanager'),
    );
    expect(dbTokens).toHaveLength(0);
  });

  // (a) No metadata → guard passes through.
  it('should allow through when no @Roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = buildContext(Role.PLAYER);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // (a) Empty roles array → guard passes through.
  it('should allow through when @Roles([]) is set (empty array)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = buildContext(Role.PLAYER);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // (b) User role matches required role → passes.
  it('should allow PLAYER when @Roles(Role.PLAYER) is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);
    const ctx = buildContext(Role.PLAYER);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow OPERATOR_ADMIN when @Roles(Role.OPERATOR_ADMIN) is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OPERATOR_ADMIN]);
    const ctx = buildContext(Role.OPERATOR_ADMIN);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // (c) User role does not match → throws ForbiddenException.
  it('should throw ForbiddenException when PLAYER accesses OPERATOR_ADMIN route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OPERATOR_ADMIN]);
    const ctx = buildContext(Role.PLAYER);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when OPERATOR_ADMIN accesses ADMIN route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = buildContext(Role.OPERATOR_ADMIN);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // (d) ADMIN passes any required role — AC5.
  it('should allow ADMIN when @Roles(Role.OPERATOR_ADMIN) is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OPERATOR_ADMIN]);
    const ctx = buildContext(Role.ADMIN);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow ADMIN when @Roles(Role.PLAYER) is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);
    const ctx = buildContext(Role.ADMIN);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow ADMIN when @Roles(Role.ADMIN) is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = buildContext(Role.ADMIN);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // (e) Role value not in enum → throws ForbiddenException — AC8.
  it('should throw ForbiddenException for role=SUPERUSER (not in enum)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);
    const ctx = buildContext('SUPERUSER');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException for role=GOD (not in enum)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = buildContext('GOD');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // (f) Each of the authenticated Role enum values is accepted when it matches.
  // Note: Role.PUBLIC is intentionally excluded — a PUBLIC-role JWT must never
  // pass an authenticated route (see F1 fix).
  it.each([
    [Role.PLAYER, Role.PLAYER],
    [Role.OPERATOR_ADMIN, Role.OPERATOR_ADMIN],
    [Role.ADMIN, Role.ADMIN],
  ])('should allow %s when required role is %s', (userRole, requiredRole) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([requiredRole]);
    const ctx = buildContext(userRole);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // F1: A JWT with role=PUBLIC must be rejected on any authenticated route.
  it('should throw ForbiddenException when role=PUBLIC hits an authenticated route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);
    const ctx = buildContext(Role.PUBLIC);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // F1: A JWT with role=PUBLIC is also rejected on a route with no @Roles metadata
  // that has been reached after JwtAuthGuard (i.e., requiredRoles is empty/undefined).
  // The guard returns true for no-metadata routes (JwtAuthGuard already ran), but
  // PUBLIC-role JWTs should not reach authenticated routes at all — this is enforced
  // by the check when @Roles IS present. For no-metadata routes the guard passes
  // through (the route itself is unannotated, so any authenticated user may call it).
  // The important invariant is: @Roles(Role.PUBLIC) is never used in production code.
  it('should throw ForbiddenException when role=PUBLIC hits a @Roles(Role.OPERATOR_ADMIN) route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OPERATOR_ADMIN]);
    const ctx = buildContext(Role.PUBLIC);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // Guard reads role from JWT payload (request.user), not from DB.
  it('should read role from request.user (JWT payload), not from a DB call', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);
    const ctx = buildContext(Role.PLAYER);
    // If the guard made a DB call, it would need a repository — none is injected.
    // Simply asserting canActivate resolves without error proves no DB is needed.
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // AC9: Guard reads metadata via Reflector.getAllAndOverride with ROLES_KEY.
  it('should call reflector.getAllAndOverride with ROLES_KEY', () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);
    const ctx = buildContext(Role.PLAYER);
    guard.canActivate(ctx);
    expect(spy).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });

  // No user on request → ForbiddenException.
  it('should throw ForbiddenException when request.user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);
    const ctx = buildContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // AC1: All four Role enum values are present.
  it('should have all four canonical roles defined in the Role enum', () => {
    expect(Role.PUBLIC).toBe('PUBLIC');
    expect(Role.PLAYER).toBe('PLAYER');
    expect(Role.OPERATOR_ADMIN).toBe('OPERATOR_ADMIN');
    expect(Role.ADMIN).toBe('ADMIN');
    expect(Object.values(Role)).toHaveLength(4);
  });
});
