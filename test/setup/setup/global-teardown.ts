import chalk from 'chalk';
import { execSync } from 'child_process';
import env from 'env-var';
import { exec } from 'child_process';
import * as util from 'util';

const execPromise = util.promisify(exec);

const TEARDOWN_CONTAINERS = env.get('TEARDOWN_CONTAINERS').required().asBoolStrict();

interface GlobalTearDownHookArgs {
  /**
   * The rollback tester looks for all files in the migrations folder by default
   * If you want to ignore certain files/paths, you can pass them in here
   */
  migrationPathsToIgnore?: string[];
  /**
   * Eventually will be on by default but introducing as optional in-case there are edge case failures
   */
  testRollbacks?: boolean;
}

export const teardown = async (force?: true): Promise<void> => {
  console.time(chalk.magenta('global-teardown'));
  if (TEARDOWN_CONTAINERS || force) {
    execSync('npm run docker:teardown');
  } else {
    console.info(
      chalk.yellow(
        `
          Docker containers have been left up.
          If you want a squeaky clean test, run "docker compose down" in this directory,
          Then set TEARDOWN_CONTAINERS=true
          This will delete the database created by the test
        `,
      ),
    );
  }

  console.timeEnd(chalk.magenta('global-teardown'));
};

export const testUpdatedMigrationRollbacks = async (args?: { migrationPathsToIgnore?: string[] }) => {
  const { stdout, stderr } = await execPromise(
    `git diff --name-only --diff-filter=A origin/master -- ${process.cwd()}/migrations/`,
  );

  if (!stdout || stderr) {
    console.log(chalk.green('No new migration rollbacks to test. Continuing teardown.'));
    return;
  }

  const filePathsToIgnore = ['template.ts', 'utils/index.ts', 'tsconfig.json', ...(args?.migrationPathsToIgnore || [])];
  const parsedFileNames = stdout
    .toString()
    .trim()
    .split('\n')
    .filter(file => !filePathsToIgnore.some(filePath => file.endsWith(filePath)))
    .map(file => file.replace('migrations/', ''))
    .reverse();

  console.time(chalk.yellow('Running migration rollback...'));

  for (const file of parsedFileNames) {
    console.log(chalk.yellow(`running down for: ${file}`));
    console.time(chalk.green('Rollback completed'));
    /**
     * This doesn't error if the down is empty.
     * It also doesn't assert if the down correctly reverts the up
     * It merely asserts that the down that does exit contains no runtime errors.
     */
    await execPromise(`FILE=${file} npm run knex:migrate:down`)
      .catch(async error => {
        console.error(chalk.red('Error running test migration down'), error);
        await teardown(true);
        process.exit(1);
      });

    /**
     * Could run the UP again for only the new migrations, and see if they run.
     * If they do, we know that a roll forward would work based on the rollback...
     */
    console.timeEnd(chalk.green('Rollback completed'));
  }
};

/**
 * The hook inside the global teardown in the service should call this function directly
 */
export const globalTeardownHook = async (args?: GlobalTearDownHookArgs) => {
  if (args?.testRollbacks) {
    await testUpdatedMigrationRollbacks(args);
  }

  await teardown();
}
