import { SetMetadata } from '@nestjs/common';
import { Roles, ROLES_KEY } from './roles.decorator';
import { Role } from './roles.enum';

// Mock SetMetadata so we can inspect calls.
jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual<typeof import('@nestjs/common')>('@nestjs/common');
  return {
    ...actual,
    SetMetadata: jest.fn(actual.SetMetadata),
  };
});

describe('@Roles decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call SetMetadata with ROLES_KEY and the supplied roles array', () => {
    Roles(Role.ADMIN);
    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, [Role.ADMIN]);
  });

  it('should call SetMetadata with multiple roles', () => {
    Roles(Role.PLAYER, Role.OPERATOR_ADMIN);
    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, [Role.PLAYER, Role.OPERATOR_ADMIN]);
  });

  it('should use ROLES_KEY = "roles" as the metadata key', () => {
    expect(ROLES_KEY).toBe('roles');
  });

  it('should return a decorator function', () => {
    const decorator = Roles(Role.PLAYER);
    expect(typeof decorator).toBe('function');
  });

  it('should attach metadata to a class method when applied', () => {
    class TestController {
      @Roles(Role.ADMIN)
      testMethod(): void {
        // stub
      }
    }
    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual([Role.ADMIN]);
  });
});
