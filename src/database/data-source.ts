import 'reflect-metadata';
import { DataSource } from 'typeorm';

/**
 * Standalone TypeORM DataSource used by the TypeORM CLI (migration:run,
 * migration:generate, migration:revert).  This is NOT used by the NestJS
 * DI container — that is handled by DatabaseModule.
 *
 * Environment variables (same as DatabaseModule):
 *   DB_HOST     — PostgreSQL host     (default: localhost)
 *   DB_PORT     — PostgreSQL port     (default: 5432)
 *   DB_USER     — PostgreSQL user     (default: postgres)
 *   DB_PASSWORD — PostgreSQL password (default: '')
 *   DB_NAME     — PostgreSQL database (default: ttt)
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  username: process.env['DB_USER'] ?? 'postgres',
  password: process.env['DB_PASSWORD'] ?? '',
  database: process.env['DB_NAME'] ?? 'ttt',
  synchronize: false,
  logging: false,
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
