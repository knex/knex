import chalk from 'chalk';
import { execSync } from 'child_process';

const migrationRuntime = 'migration-run-time';

export const runMigrations = async (runMigrations: boolean): Promise<void> => {
  if (!runMigrations) {
    console.info(
      chalk.yellow(`
        Skipping knex migrations... if you are testing a new migration, set RUN_TEST_MIGRATIONS to true
      `),
    );
    return;
  }

  console.info(chalk.magenta('Running migrations... please wait'));
  console.time(chalk.magenta(migrationRuntime));

  execSync('npm run knex:migrate:latest');

  console.timeEnd(chalk.magenta(migrationRuntime));
};
