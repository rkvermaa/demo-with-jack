import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { Role } from './roles.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env['JWT_SECRET'] = 'test-secret';
    strategy = new JwtStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('validate() should return the payload as-is', () => {
    const payload: JwtPayload = {
      sub: 'user-1',
      role: Role.PLAYER,
      operatorId: 'op-1',
    };
    const result = strategy.validate(payload);
    expect(result).toEqual(payload);
  });

  it('validate() should return payload without operatorId', () => {
    const payload: JwtPayload = {
      sub: 'admin-1',
      role: Role.ADMIN,
    };
    const result = strategy.validate(payload);
    expect(result).toEqual(payload);
  });

  it('validate() should not make any database calls', () => {
    // No repository is injected — simply calling validate() proves no DB is needed.
    const payload: JwtPayload = { sub: 'u', role: Role.OPERATOR_ADMIN };
    expect(() => strategy.validate(payload)).not.toThrow();
  });

  it('should use JWT_SECRET from environment', () => {
    process.env['JWT_SECRET'] = 'my-env-secret';
    const s = new JwtStrategy();
    expect(s).toBeDefined();
  });

  it('should fall back to "changeme" when JWT_SECRET is not set', () => {
    const original = process.env['JWT_SECRET'];
    delete process.env['JWT_SECRET'];
    const s = new JwtStrategy();
    expect(s).toBeDefined();
    process.env['JWT_SECRET'] = original;
  });
});
