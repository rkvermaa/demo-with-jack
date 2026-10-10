import 'reflect-metadata';
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as jwtLib from 'jsonwebtoken';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { DatabaseModule } from '../src/database/database.module';
import { User } from '../src/entities/user.entity';
import { Role } from '../src/auth/roles.enum';

/**
 * Stub that replaces DatabaseModule so no real PostgreSQL connection is made.
 */
@Module({})
class DatabaseModuleStub {}

/**
 * Factory that builds a fresh in-memory user repository mock.
 * `existingEmail` controls whether findOneBy simulates a duplicate.
 */
function makeMockUserRepository(existingEmail?: string) {
  return {
    findOneBy: jest.fn().mockImplementation(({ email }: { email: string }) => {
      if (existingEmail && email === existingEmail) {
        return Promise.resolve({
          id: 'existing-uuid',
          email,
          password: '$2b$10$hashedpassword',
          role: Role.PLAYER,
        });
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((dto: Partial<User>) => dto),
    save: jest.fn().mockImplementation((entity: Partial<User>) =>
      Promise.resolve({ id: 'new-uuid', role: Role.PLAYER, ...entity }),
    ),
  };
}

describe('POST /auth/register (e2e)', () => {
  let app: INestApplication;
  let mockRepo: ReturnType<typeof makeMockUserRepository>;

  beforeAll(async () => {
    mockRepo = makeMockUserRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(DatabaseModuleStub)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to no-conflict state before each test
    mockRepo.findOneBy.mockImplementation(({ email }: { email: string }) => {
      void email;
      return Promise.resolve(null);
    });
    mockRepo.save.mockImplementation((entity: Partial<User>) =>
      Promise.resolve({ id: 'new-uuid', role: Role.PLAYER, ...entity }),
    );
  });

  // ── AC1 + AC7: Valid body, no Authorization header → 201 + accessToken ───

  it('AC1/AC7 — valid body with no Authorization header returns 201 and accessToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'ValidPass1!' });
    // No Authorization header — proves AC7 (public route)

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.accessToken.length).toBeGreaterThan(0);
  });

  // ── AC2: JWT payload contains sub and role=PLAYER ────────────────────────

  it('AC2 — JWT payload contains sub (non-empty string) and role=PLAYER', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'player@example.com', password: 'ValidPass1!' });

    expect(res.status).toBe(201);

    const token: string = res.body.accessToken as string;
    const payload = jwtLib.decode(token) as Record<string, unknown>;

    expect(payload).toBeDefined();
    expect(typeof payload['sub']).toBe('string');
    expect((payload['sub'] as string).length).toBeGreaterThan(0);
    expect(payload['role']).toBe(Role.PLAYER);
  });

  // ── AC4: Duplicate email → 409 with human-readable message ───────────────

  it('AC4 — duplicate email returns 409 with message containing "email"', async () => {
    const duplicateEmail = 'dup@example.com';

    // First call: no conflict
    mockRepo.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'existing-uuid',
        email: duplicateEmail,
        password: '$2b$10$hash',
        role: Role.PLAYER,
      });

    // First registration succeeds
    const first = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: duplicateEmail, password: 'ValidPass1!' });
    expect(first.status).toBe(201);

    // Second registration with same email → 409
    const second = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: duplicateEmail, password: 'ValidPass1!' });

    expect(second.status).toBe(409);
    expect(second.body).toHaveProperty('message');
    const message: string = second.body.message as string;
    expect(message.toLowerCase()).toContain('email');
  });

  // ── AC5: Missing email → 400 ─────────────────────────────────────────────

  it('AC5a — missing email field returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ password: 'ValidPass1!' });

    expect(res.status).toBe(400);
  });

  // ── AC5: Malformed email → 400 ───────────────────────────────────────────

  it('AC5b — malformed email returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'ValidPass1!' });

    expect(res.status).toBe(400);
  });

  // ── AC6: Missing password → 400 ──────────────────────────────────────────

  it('AC6a — missing password field returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'new@example.com' });

    expect(res.status).toBe(400);
  });

  // ── AC6: Empty password → 400 ────────────────────────────────────────────

  it('AC6b — empty password returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'new@example.com', password: '' });

    expect(res.status).toBe(400);
  });

  // ── AC7: No Authorization header → 201 (not 401/403) ─────────────────────

  it('AC7 — no Authorization header returns 201 (not 401 or 403)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'public@example.com', password: 'ValidPass1!' });
    // Deliberately no .set('Authorization', ...) call

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect(res.status).toBe(201);
  });
});
