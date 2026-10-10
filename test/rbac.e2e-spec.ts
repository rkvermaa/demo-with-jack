import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { DatabaseModule } from '../src/database/database.module';
import { Role } from '../src/auth/roles.enum';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'changeme';

/**
 * Stub that replaces DatabaseModule in e2e tests so no real PostgreSQL
 * connection is attempted.  All routes under test are pure HTTP/auth logic
 * and do not touch the database.
 */
@Module({})
class DatabaseModuleStub {}

/**
 * Signs a JWT with the given role, sub, and optional operatorId.
 * Uses the same secret as the application so the token is accepted.
 */
function makeJwt(
  role: string,
  sub = 'test-user',
  operatorId?: string,
): string {
  const payload: Record<string, unknown> = { sub, role };
  if (operatorId !== undefined) {
    payload['operatorId'] = operatorId;
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('RBAC Integration Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(DatabaseModuleStub)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── AC6: PUBLIC routes accessible without token ──────────────────────────

  it('AC6 — GET /health with no token returns 200 { status: ok }', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('AC6 — POST /auth/login with no token returns 200', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login');
    expect(res.status).toBe(200);
  });

  it('AC6 — POST /auth/register with no token returns 201', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register');
    expect(res.status).toBe(201);
  });

  // ── AC2: Unauthenticated request to protected route returns 401 ──────────

  it('AC2 — GET /player/wallet with no token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/player/wallet');
    expect(res.status).toBe(401);
  });

  it('AC2 — GET /operator/dashboard with no token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/operator/dashboard');
    expect(res.status).toBe(401);
  });

  it('AC2 — GET /admin/users with no token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/admin/users');
    expect(res.status).toBe(401);
  });

  // ── AC3: PLAYER on OPERATOR_ADMIN route returns 403 ─────────────────────

  it('AC3 — PLAYER JWT on GET /operator/dashboard returns 403', async () => {
    const token = makeJwt(Role.PLAYER, 'player-1');
    const res = await request(app.getHttpServer())
      .get('/operator/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  // ── AC4: OPERATOR_ADMIN on ADMIN route returns 403 ───────────────────────

  it('AC4 — OPERATOR_ADMIN JWT on GET /admin/users returns 403', async () => {
    const token = makeJwt(Role.OPERATOR_ADMIN, 'op-admin-1', 'opA');
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  // ── AC5: ADMIN accesses OPERATOR_ADMIN and PLAYER routes ─────────────────

  it('AC5a — ADMIN JWT on GET /operator/dashboard returns 200', async () => {
    const token = makeJwt(Role.ADMIN, 'admin-1');
    const res = await request(app.getHttpServer())
      .get('/operator/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('AC5b — ADMIN JWT on GET /player/wallet/:id (matching sub) returns 200', async () => {
    const token = makeJwt(Role.ADMIN, 'admin-1');
    const res = await request(app.getHttpServer())
      .get('/player/wallet/admin-1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('AC5c — ADMIN JWT on GET /player/wallet returns 200', async () => {
    const token = makeJwt(Role.ADMIN, 'admin-1');
    const res = await request(app.getHttpServer())
      .get('/player/wallet')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('AC5d — ADMIN JWT on GET /admin/users returns 200', async () => {
    const token = makeJwt(Role.ADMIN, 'admin-1');
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // ── AC8: Tampered role claim returns 403 ─────────────────────────────────

  it('AC8 — JWT with role=SUPERUSER on GET /player/wallet returns 403', async () => {
    const token = makeJwt('SUPERUSER', 'hacker-1');
    const res = await request(app.getHttpServer())
      .get('/player/wallet')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('AC8 — JWT with role=GOD on GET /admin/users returns 403', async () => {
    const token = makeJwt('GOD', 'hacker-2');
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  // ── AC10: OPERATOR_ADMIN_A cannot access operator B resource ─────────────

  it('AC10 — OPERATOR_ADMIN_A JWT on GET /operator/dashboard?operatorId=opB returns 403', async () => {
    const token = makeJwt(Role.OPERATOR_ADMIN, 'op-admin-A', 'opA');
    const res = await request(app.getHttpServer())
      .get('/operator/dashboard?operatorId=opB')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('AC10 — OPERATOR_ADMIN_A JWT on GET /operator/dashboard?operatorId=opA returns 200', async () => {
    const token = makeJwt(Role.OPERATOR_ADMIN, 'op-admin-A', 'opA');
    const res = await request(app.getHttpServer())
      .get('/operator/dashboard?operatorId=opA')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // ── AC11: PLAYER_X cannot access PLAYER_Y resource ───────────────────────

  it('AC11 — PLAYER_X JWT on GET /player/wallet/playerY returns 403', async () => {
    const token = makeJwt(Role.PLAYER, 'playerX');
    const res = await request(app.getHttpServer())
      .get('/player/wallet/playerY')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('AC11 — PLAYER_X JWT on GET /player/wallet/playerX returns 200', async () => {
    const token = makeJwt(Role.PLAYER, 'playerX');
    const res = await request(app.getHttpServer())
      .get('/player/wallet/playerX')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // ── Additional: PLAYER can access own wallet (no :playerId param) ─────────

  it('PLAYER JWT on GET /player/wallet (no param) returns 200', async () => {
    const token = makeJwt(Role.PLAYER, 'playerX');
    const res = await request(app.getHttpServer())
      .get('/player/wallet')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // ── Additional: Invalid JWT signature returns 401 ─────────────────────────

  it('Invalid JWT signature returns 401', async () => {
    const token = jwt.sign({ sub: 'user', role: Role.PLAYER }, 'wrong-secret');
    const res = await request(app.getHttpServer())
      .get('/player/wallet')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
