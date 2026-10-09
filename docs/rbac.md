# RBAC — Role-Based Access Control

> **Canonical reference for GCG-5.** All future stories that add protected routes must
> consult this document to choose the correct role and decorator pattern.

---

## 1. Role Definitions

| Role | Value | Description |
|------|-------|-------------|
| `PUBLIC` | `'PUBLIC'` | Unauthenticated visitors. No JWT required. |
| `PLAYER` | `'PLAYER'` | Registered end-users with an internal wallet. |
| `OPERATOR_ADMIN` | `'OPERATOR_ADMIN'` | Administrators of a specific operator account (multi-tenant). |
| `ADMIN` | `'ADMIN'` | Platform super-administrators. Highest privilege level. |

All four values are defined in **one canonical location**:
`src/auth/roles.enum.ts` — no other file may declare these string literals.

---

## 2. Privilege Hierarchy

```
ADMIN  >  OPERATOR_ADMIN  >  PLAYER  >  PUBLIC
```

- **ADMIN** is a superset of all other roles. An ADMIN JWT passes every role check.
- **OPERATOR_ADMIN** can access operator-scoped routes for their own operator account only.
- **PLAYER** can access player-scoped routes for their own player account only.
- **PUBLIC** routes require no authentication at all.

---

## 3. Route Categories and Permitted Roles

| Route Category | Example Path | Permitted Roles |
|----------------|-------------|-----------------|
| Public | `GET /health`, `POST /auth/login`, `POST /auth/register` | Everyone (no token) |
| Player | `GET /player/wallet`, `GET /player/wallet/:playerId` | PLAYER (own resources), ADMIN |
| Operator | `GET /operator/dashboard` | OPERATOR_ADMIN (own operator), ADMIN |
| Admin | `GET /admin/users` | ADMIN only |

---

## 4. Declaring a Protected Route

### Require a specific role

```typescript
import { Roles } from '../auth';
import { Role } from '../auth';

@Roles(Role.PLAYER)
@Get('player/wallet')
getWallet() { ... }
```

### Require ADMIN only

```typescript
@Roles(Role.ADMIN)
@Get('admin/users')
getUsers() { ... }
```

### Multiple permitted roles

```typescript
@Roles(Role.PLAYER, Role.OPERATOR_ADMIN)
@Get('some/shared/route')
sharedRoute() { ... }
```

---

## 5. Opting Out — PUBLIC Routes

Any route that should be accessible **without a JWT** must be decorated with `@Public()`:

```typescript
import { Public } from '../auth';

@Public()
@Get('health')
healthCheck() { return { status: 'ok' }; }
```

> ⚠️ **Warning:** Every route that omits `@Public()` is protected by default.
> Forgetting `@Public()` on a login or health endpoint will silently return 401 in production.

---

## 6. Operator Scoping (AC10)

`OperatorScopeGuard` enforces that an `OPERATOR_ADMIN` user can only access resources
belonging to their own operator account.

Apply it alongside `@Roles(Role.OPERATOR_ADMIN)`:

```typescript
@Roles(Role.OPERATOR_ADMIN)
@UseGuards(OperatorScopeGuard)
@Get('operator/dashboard')
getDashboard(@Query('operatorId') operatorId: string) { ... }
```

The guard reads `operatorId` from (in priority order):
1. Route param (`:operatorId`)
2. Query param (`?operatorId=`)
3. Request body (`{ operatorId: '...' }`)

If the `operatorId` in the request does not match `request.user.operatorId` from the JWT,
the guard throws **HTTP 403**.

ADMIN users bypass this check unconditionally.

---

## 7. Player Scoping (AC11)

`PlayerScopeGuard` enforces that a `PLAYER` user can only access their own resources.

Apply it alongside `@Roles(Role.PLAYER)`:

```typescript
@Roles(Role.PLAYER)
@UseGuards(PlayerScopeGuard)
@Get('player/wallet/:playerId')
getWalletById(@Param('playerId') playerId: string) { ... }
```

The guard compares `request.user.sub` (from the JWT) against the `:playerId` route param.
A mismatch throws **HTTP 403**.

ADMIN and OPERATOR_ADMIN users bypass this check unconditionally.

---

## 8. JWT Claim Contract (agreed with GCG-4)

Every authenticated JWT must contain the following claims:

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | `string` | User ID (player ID for PLAYER role) |
| `role` | `string` | One of the four `Role` enum values |
| `operatorId` | `string \| undefined` | Operator account ID (present for OPERATOR_ADMIN) |
| `iat` | `number` | Issued-at timestamp (standard JWT) |
| `exp` | `number` | Expiry timestamp (standard JWT) |

> The RBAC guard reads `role` exclusively from the decoded JWT payload.
> **No database call is made on every request.**

---

## 9. Guard Execution Order

NestJS applies global guards in registration order (see `src/app.module.ts`):

1. **JwtAuthGuard** — validates the Bearer token; returns **401** for missing/invalid tokens.
   Skips validation for `@Public()` routes.
2. **RolesGuard** — checks `request.user.role` against `@Roles()` metadata; returns **403**
   for insufficient role or invalid role value.
3. **OperatorScopeGuard** / **PlayerScopeGuard** — applied per-route via `@UseGuards()`;
   return **403** for cross-tenant/cross-player access.

---

## 10. HTTP Response Summary

| Scenario | HTTP Status |
|----------|-------------|
| No token on protected route | 401 |
| Invalid/expired token | 401 |
| Valid token, insufficient role | 403 |
| Valid token, role not in enum (tampered) | 403 |
| OPERATOR_ADMIN accessing another operator's resource | 403 |
| PLAYER accessing another player's resource | 403 |
| Authorised request | 200 (or route's normal success code) |
| PUBLIC route (no token) | 200 / 201 |
