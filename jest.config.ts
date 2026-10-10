import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  // Coverage is scoped to src/auth/** — the RBAC infrastructure this story owns.
  // Fixture controllers and app bootstrap are exercised by e2e tests, not unit tests.
  // Barrel (index.ts) and module wiring (auth.module.ts) are excluded — they contain
  // no logic, only re-exports and DI declarations.
  // src/database/** is excluded: TypeORM wiring and migration files contain no
  // testable logic and would dilute the 80% gate if included.
  collectCoverageFrom: [
    'src/auth/**/*.(t|j)s',
    '!src/auth/auth.module.ts',
    '!src/auth/index.ts',
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
