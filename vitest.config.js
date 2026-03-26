import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: parseInt(process.env.KNEX_TEST_TIMEOUT || '30000', 10),
    hookTimeout: parseInt(process.env.KNEX_TEST_TIMEOUT || '30000', 10),
    globals: true,
    reporters: ['default'],
    restoreMocks: true,
    // Uncomment to see all the places that we need to do a better job cleaning up,
    // both internally in knex, and in our tests
    // detectAsyncLeaks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['lib/**/*.js', 'bin/**/*.js'],
      exclude: ['lib/dialects/oracle/**', 'lib/dialects/oracledb/**'],
      reportOnFailure: true,
    },
    projects: [
      defineProject({
        test: {
          name: 'unit',
          globals: true,
          include: ['test/unit/**/*.test.js'],
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          globals: true,
          include: [
            'test/integration/**/*.test.js',
            'test/integration2/**/*.test.js',
            'test/tape/**/*.test.js',
          ],
          testTimeout: parseInt(process.env.KNEX_TEST_TIMEOUT || '30000', 10),
          hookTimeout: parseInt(process.env.KNEX_TEST_TIMEOUT || '30000', 10),
          fileParallelism: false,
          passWithNoTests: true,
          sequence: {
            shuffle: {
              files: true,
              tests: true,
            },
          },
        },
      }),
      defineProject({
        test: {
          name: 'cli',
          globals: true,
          include: ['test/cli/**/*.test.js'],
          testTimeout: parseInt(process.env.KNEX_TEST_TIMEOUT || '30000', 10),
          fileParallelism: false,
        },
      }),
    ],
  },
});
