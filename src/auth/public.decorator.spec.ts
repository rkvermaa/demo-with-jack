import { Public, IS_PUBLIC_KEY } from './public.decorator';
import { SetMetadata } from '@nestjs/common';

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual<typeof import('@nestjs/common')>('@nestjs/common');
  return {
    ...actual,
    SetMetadata: jest.fn(actual.SetMetadata),
  };
});

describe('@Public decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call SetMetadata with IS_PUBLIC_KEY and true', () => {
    Public();
    expect(SetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
  });

  it('should use IS_PUBLIC_KEY = "isPublic"', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('should return a decorator function', () => {
    const decorator = Public();
    expect(typeof decorator).toBe('function');
  });

  it('should attach metadata to a class method when applied', () => {
    class TestController {
      @Public()
      testMethod(): void {
        // stub
      }
    }
    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestController.prototype.testMethod);
    expect(metadata).toBe(true);
  });
});
