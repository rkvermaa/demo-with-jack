/**
 * Canonical Role enum — single source of truth for all role values in the platform.
 *
 * Privilege hierarchy (highest → lowest):
 *   ADMIN > OPERATOR_ADMIN > PLAYER > PUBLIC
 *
 * No other file in the codebase may declare these string literals.
 * Import from the barrel: import { Role } from '../auth';
 */
export enum Role {
  PUBLIC = 'PUBLIC',
  PLAYER = 'PLAYER',
  OPERATOR_ADMIN = 'OPERATOR_ADMIN',
  ADMIN = 'ADMIN',
}
