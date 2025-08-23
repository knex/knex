import chalk from 'chalk';

import { setup } from './setup/index.setup';
import { teardown } from './setup/global-teardown';

export const mochaGlobalSetup = async () => {
  console.log(chalk.green(
    `${new Date().toISOString()} running integration tests`),
  );
  console.time(chalk.magenta('global-setup'));

  try {
    await Promise.all([
      setup(),
    ]);

    console.timeEnd(chalk.magenta('global-setup'));
  } catch (error) {
    console.error(chalk.red((`Error during setup, cleaning up...`)), error);
    // Force teardown if there is an error (clean state)
    await teardown(true);
    process.exit(1);
  }
};

export const mochaGlobalTeardown = async () => {
  await teardown(true);
}
