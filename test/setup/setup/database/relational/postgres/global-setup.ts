import chalk from 'chalk';
import docker from 'docker-compose';

import { getIntegrationTestPath } from '../../../helpers/helpers';
import { DatabaseConfig } from '../types';

export const awaitReady = async (): Promise<void> => {
  await docker.exec(
    'postgres', // If this is misnamed, the error is not helpful (object Object)
    ['sh', '-c', 'until pg_isready ; do sleep 1; done'],
    {
      cwd: getIntegrationTestPath(),
    },
  );
};

export const createDatabase = async (args: DatabaseConfig): Promise<void> => {
  await docker.exec(
    'postgres',
    ['sh', '-c', `createdb -h 0.0.0.0 -p 5432 -U ${args.user} ${args.database}`],
    {
      cwd: getIntegrationTestPath(),
    },
  ).catch(e => {
    // This is expected if the container is already running or the database already exists on the postgres instance
    if (typeof e.err === 'string' && e.err?.includes('already exists')) {
      console.log(chalk.yellow(`Database already exists... continuing`));
      return;
    }

    throw e;
  });
};
