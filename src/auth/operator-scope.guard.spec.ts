import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OperatorScopeGuard } from './operator-scope.guard';
import { Role } from './roles.enum';

function buildContext(
  role: string,
  operatorId: string | undefined,
  resourceOperatorId?: string,
): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { role, sub: 'user-1', operatorId },
        params: resourceOperatorId ? { operatorId: resourceOperatorId } : {},
        query: {},
        body: {},
      }),
    }),
  } as unknown as ExecutionContext;
}

function buildContextWithQuery(
  role: string,
  operatorId: string | undefined,
  queryOperatorId?: string,
): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { role, sub: 'user-1', operatorId },
        params: {},
        query: queryOperatorId ? { operatorId: queryOperatorId } : {},
        body: {},
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('OperatorScopeGuard', () => {
  let guard: OperatorScopeGuard;

  beforeEach(() => {
    guard = new OperatorScopeGuard();
  });

  // (a) ADMIN passes regardless of operatorId mismatch.
  it('should allow ADMIN even when operatorId mismatches', () => {
    const ctx = buildContext(Role.ADMIN, 'opA', 'opB');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow ADMIN when no operatorId is present', () => {
    const ctx = buildContext(Role.ADMIN, undefined, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // (b) OPERATOR_ADMIN with matching operatorId passes.
  it('should allow OPERATOR_ADMIN when operatorId matches (route param)', () => {
    const ctx = buildContext(Role.OPERATOR_ADMIN, 'opA', 'opA');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow OPERATOR_ADMIN when operatorId matches (query param)', () => {
    const ctx = buildContextWithQuery(Role.OPERATOR_ADMIN, 'opA', 'opA');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // (c) OPERATOR_ADMIN with mismatched operatorId throws 403.
  it('should throw ForbiddenException when OPERATOR_ADMIN operatorId mismatches (route param)', () => {
    const ctx = buildContext(Role.OPERATOR_ADMIN, 'opA', 'opB');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when OPERATOR_ADMIN operatorId mismatches (query param)', () => {
    const ctx = buildContextWithQuery(Role.OPERATOR_ADMIN, 'opA', 'opB');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // OPERATOR_ADMIN with no resource operatorId passes (route not scoped).
  it('should allow OPERATOR_ADMIN when no resource operatorId is present', () => {
    const ctx = buildContext(Role.OPERATOR_ADMIN, 'opA', undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // PLAYER passes through (RolesGuard already blocked unauthorised roles).
  it('should allow PLAYER through (scoping not applicable)', () => {
    const ctx = buildContext(Role.PLAYER, undefined, 'opA');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // Body-based operatorId extraction.
  it('should allow OPERATOR_ADMIN when operatorId matches in request body', () => {
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: Role.OPERATOR_ADMIN, sub: 'user-1', operatorId: 'opA' },
          params: {},
          query: {},
          body: { operatorId: 'opA' },
        }),
      }),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when OPERATOR_ADMIN operatorId mismatches in body', () => {
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: Role.OPERATOR_ADMIN, sub: 'user-1', operatorId: 'opA' },
          params: {},
          query: {},
          body: { operatorId: 'opB' },
        }),
      }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // No user → ForbiddenException.
  it('should throw ForbiddenException when no user is present', () => {
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: undefined, params: {}, query: {}, body: {} }),
      }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
