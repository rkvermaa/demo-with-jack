import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterService } from './register.service';
import { User } from '../entities/user.entity';
import { Role } from '../auth/roles.enum';
import { RegisterDto } from './dto/register.dto';

// Mock bcrypt at the module level so no real CPU-heavy hashing runs in unit
// tests.  The service spec only needs to verify that the service *calls*
// bcrypt.hash and stores its return value — not that bcrypt itself is correct.
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('RegisterService', () => {
  let service: RegisterService;

  // Mocks
  const mockUserRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default bcrypt.hash stub: returns a recognisable fake hash string.
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$mockedhashvalue');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<RegisterService>(RegisterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── AC1: Happy path — returns accessToken ────────────────────────────────

  it('AC1 — register returns { accessToken } on valid input', async () => {
    const dto: RegisterDto = {
      email: 'new@example.com',
      password: 'ValidPass1!',
    };
    const savedUser: Partial<User> = {
      id: 'uuid-123',
      email: dto.email,
      password: 'hashed',
      role: Role.PLAYER,
    };

    mockUserRepository.findOneBy.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue(savedUser);
    mockUserRepository.save.mockResolvedValue(savedUser);
    mockJwtService.sign.mockReturnValue('signed.jwt.token');

    const result = await service.register(dto);

    expect(result).toEqual({ accessToken: 'signed.jwt.token' });
  });

  // ── AC2: JWT payload contains sub and role PLAYER ────────────────────────

  it('AC2 — JwtService.sign is called with { sub: user.id, role: PLAYER }', async () => {
    const dto: RegisterDto = {
      email: 'player@example.com',
      password: 'ValidPass1!',
    };
    const savedUser: Partial<User> = {
      id: 'uuid-456',
      email: dto.email,
      password: 'hashed',
      role: Role.PLAYER,
    };

    mockUserRepository.findOneBy.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue(savedUser);
    mockUserRepository.save.mockResolvedValue(savedUser);
    mockJwtService.sign.mockReturnValue('tok');

    await service.register(dto);

    expect(mockJwtService.sign).toHaveBeenCalledWith({
      sub: 'uuid-456',
      role: Role.PLAYER,
    });
  });

  // ── AC3: Password is bcrypt-hashed before save ───────────────────────────

  it('AC3 — password is bcrypt-hashed before being passed to repository.save', async () => {
    const plainPassword = 'ValidPass1!';
    const dto: RegisterDto = { email: 'hash@example.com', password: plainPassword };

    let capturedEntity: Partial<User> | undefined;

    mockUserRepository.findOneBy.mockResolvedValue(null);
    mockUserRepository.create.mockImplementation((entity: Partial<User>) => {
      capturedEntity = entity;
      return entity;
    });
    mockUserRepository.save.mockImplementation((entity: Partial<User>) =>
      Promise.resolve({ id: 'uuid-789', role: Role.PLAYER, ...entity }),
    );
    mockJwtService.sign.mockReturnValue('tok');

    await service.register(dto);

    // bcrypt.hash must have been called with the plain password
    expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);

    // The entity stored must carry the hashed value, not the plain password
    expect(capturedEntity).toBeDefined();
    expect(capturedEntity!.password).not.toEqual(plainPassword);
    expect(capturedEntity!.password).toBe('$2b$10$mockedhashvalue');
  });

  // ── AC4: Duplicate email throws ConflictException ────────────────────────

  it('AC4 — throws ConflictException(409) when email already exists', async () => {
    const dto: RegisterDto = {
      email: 'existing@example.com',
      password: 'ValidPass1!',
    };
    const existingUser: Partial<User> = {
      id: 'existing-uuid',
      email: dto.email,
      password: 'hashed',
      role: Role.PLAYER,
    };

    mockUserRepository.findOneBy.mockResolvedValue(existingUser);

    await expect(service.register(dto)).rejects.toThrow(ConflictException);
    await expect(service.register(dto)).rejects.toMatchObject({
      status: 409,
      message: 'email already in use',
    });

    // Repository.save must NOT be called when a conflict is detected
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  // ── AC4: Conflict message is human-readable ──────────────────────────────

  it('AC4 — ConflictException message contains "email"', async () => {
    const dto: RegisterDto = {
      email: 'dup@example.com',
      password: 'ValidPass1!',
    };
    mockUserRepository.findOneBy.mockResolvedValue({ id: 'x' });

    try {
      await service.register(dto);
      fail('Expected ConflictException to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictException);
      expect((err as ConflictException).message).toContain('email');
    }
  });
});
