import chalk from 'chalk';
import { exec } from 'child_process';

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

  await trackBufferUsage('npm run knex:migrate:latest', {maxBuffer: 1024 * 100000000});

  console.timeEnd(chalk.magenta(migrationRuntime));
};

const trackBufferUsage = (command: string, options = {}) => {
  return new Promise((resolve, reject) => {
    const process = exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    let bufferUsage = 0;

    // @ts-ignore
    process.stdout.on('data', (data) => {
      bufferUsage += data.length;
    });

    // @ts-ignore
    process.stderr.on('data', (data) => {
      bufferUsage += data.length;
    });

    process.on('close', (_code) => {
      console.log('Buffer usage:', bufferUsage);
    });
  });
};
