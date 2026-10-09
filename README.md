# demo-with-jack

Generative Casino Games Platform — multi-game backend, operator portal, and game clients.

## RBAC Documentation

Role-based access control for all four actor types is documented in
[docs/rbac.md](docs/rbac.md).

## Getting Started

```bash
npm install
npm test          # unit tests with coverage gate
npm run test:e2e  # integration tests
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `changeme` | Secret used to sign and verify JWTs |
| `PORT` | `3000` | HTTP port |

> **Never use the default `JWT_SECRET` in production.**

## Architecture

- **Framework:** NestJS (TypeScript)
- **Auth:** JWT via `@nestjs/passport` + `passport-jwt`
- **RBAC:** Custom `RolesGuard` + `@Roles()` decorator (see [docs/rbac.md](docs/rbac.md))
- **Testing:** Jest (unit) + Supertest (e2e), 80% coverage gate enforced in CI
