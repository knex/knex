import chalk from 'chalk';

import { runMigrations } from './migrations';

interface HandleDatabaseSetupArgs {
  awaitReady: Function;
  createDatabase: Function;
}

export const handleDatabaseSetup = async (dbFunctions?: HandleDatabaseSetupArgs): Promise<void> => {
  if (!dbFunctions) {
    return;
  }

  const { DB_CONFIG, RUN_TEST_MIGRATIONS } = await import('./envVars');

  const printDatabaseConnectionCredentials = () =>{
    console.log({
      message: 'Printing environment database configuration',
      DB_CONFIG: JSON.stringify(DB_CONFIG),
    });
  };

  printDatabaseConnectionCredentials();

  /**
   * Ensure the database is 'ready' to receive connections
   */
  console.time(chalk.magenta('Database-ready-wait-time'));
  console.log(chalk.magenta('Waiting for database...'));

  await dbFunctions.awaitReady();

  console.timeEnd(chalk.magenta('Database-ready-wait-time'));
  console.timeEnd(chalk.magenta('docker-compose-up'));

  /**
   * Ensure the required database (e.g. 'offering' or 'kwiff_casino') is created
   */
  console.time(chalk.magenta('Created-database'));
  console.log(chalk.magenta('Creating database...'));
  await dbFunctions.createDatabase(DB_CONFIG);

  console.timeEnd(chalk.magenta('Created-database'));

  /**
   * Run migrations if required
   */
  await runMigrations(RUN_TEST_MIGRATIONS);
};
