import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CreateUsers — adds the `users` table.
 *
 * up:   creates the table with id, email, password, role, created_at columns.
 * down: drops the table (full rollback).
 *
 * Uses gen_random_uuid() (available in PostgreSQL ≥ 13) for UUID generation.
 * The `email` column has a UNIQUE constraint to enforce AC4 (duplicate-email 409).
 */
export class CreateUsers1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "email"      VARCHAR     NOT NULL,
        "password"   VARCHAR     NOT NULL,
        "role"       VARCHAR     NOT NULL DEFAULT 'PLAYER',
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
