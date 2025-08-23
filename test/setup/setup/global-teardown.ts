import chalk from 'chalk';
import { execSync } from 'child_process';
import env from 'env-var';

const TEARDOWN_CONTAINERS = env.get('TEARDOWN_CONTAINERS').required().asBoolStrict();

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

