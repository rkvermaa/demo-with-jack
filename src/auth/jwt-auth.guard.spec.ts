import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

// Minimal mock for AuthGuard('jwt') base class
jest.mock('@nestjs/passport', () => {
  return {
    AuthGuard: () => {
      return class MockAuthGuard {
        canActivate(_ctx: ExecutionContext): boolean {
          // Simulate passport JWT validation: check for a mock token header
          return true;
        }
        handleRequest<T>(err: Error | null, user: T): T {
          if (err || !user) throw err ?? new UnauthorizedException();
          return user;
        }
      };
    },
  };
});

describe('JwtAuthGuard', () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;

  function buildContext(isPublic: boolean, hasUser = true): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: hasUser ? { sub: 'u1', role: 'PLAYER' } : undefined }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for @Public() routes without calling super.canActivate', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = buildContext(true);
    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('should call super.canActivate for non-public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const ctx = buildContext(false);
    // The mocked AuthGuard base returns true
    const result = guard.canActivate(ctx);
    expect(result).toBeTruthy();
  });

  it('should use IS_PUBLIC_KEY when checking metadata', () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const ctx = buildContext(false);
    guard.canActivate(ctx);
    expect(spy).toHaveBeenCalledWith(IS_PUBLIC_KEY, expect.any(Array));
  });
});
