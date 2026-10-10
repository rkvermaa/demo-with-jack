import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * InitialSchema — baseline migration.
 *
 * No entities exist yet at this story (TTT-4 is the foundation setup).
 * This migration establishes the migrations table entry so that subsequent
 * migrations have a clean baseline to build on.
 *
 * When entities are introduced in later stories (e.g. User in TTT-7/8),
 * new migrations will be generated on top of this one.
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No schema changes yet — entities are introduced in later stories.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No schema changes to revert.
  }
}
