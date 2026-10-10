import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  // Coverage is scoped to src/auth/** (RBAC infrastructure) and the new
  // src/register/** (registration feature) and src/entities/** (User entity).
  //
  // Excluded from coverage:
  //  - Module files (pure DI wiring, no logic)
  //  - Barrel index files (re-exports only)
  //  - src/database/** (TypeORM wiring and migration files, no testable logic)
  collectCoverageFrom: [
    'src/auth/**/*.(t|j)s',
    '!src/auth/auth.module.ts',
    '!src/auth/index.ts',
    'src/register/**/*.(t|j)s',
    '!src/register/register.module.ts',
    '!src/register/**/*.spec.ts',
    'src/entities/**/*.(t|j)s',
    '!src/entities/**/*.spec.ts',
    '!src/database/**',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
};

export default config;
