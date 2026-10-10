import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * DatabaseModule — wires TypeORM to PostgreSQL.
 *
 * All connection settings are read from environment variables so that
 * no credentials are hard-coded and the app can be configured per-environment.
 *
 * Environment variables:
 *   DB_HOST     — PostgreSQL host (default: localhost)
 *   DB_PORT     — PostgreSQL port (default: 5432)
 *   DB_USER     — PostgreSQL user (default: postgres)
 *   DB_PASSWORD — PostgreSQL password (default: '')
 *   DB_NAME     — PostgreSQL database name (default: ttt)
 *
 * synchronize: false  — never auto-migrate; use migration:run instead.
 * migrationsRun: false — migrations are run explicitly via npm run migration:run.
 * autoLoadEntities: true — entities registered via TypeOrmModule.forFeature() are
 *                          automatically picked up without listing them here.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        host: process.env['DB_HOST'] ?? 'localhost',
        port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
        username: process.env['DB_USER'] ?? 'postgres',
        password: process.env['DB_PASSWORD'] ?? '',
        database: process.env['DB_NAME'] ?? 'ttt',
        synchronize: false,
        migrationsRun: false,
        autoLoadEntities: true,
        logging: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
