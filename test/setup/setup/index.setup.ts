import chalk from 'chalk';
import docker from 'docker-compose';
import YAML from 'yamljs';

import { getDatabaseStartupFunctions } from './database/relational/config';
import { relationalDatabases } from './database/relational/constants';
import { handleDatabaseSetup } from './database/relational/setup';
import { getIntegrationTestPath } from './helpers/helpers';

const dockerComposeYamlPath = `${getIntegrationTestPath()}/docker-compose.yml`;
// const dockerComposeYamlPath = `./docker-compose.yml`;

export const setup = async (): Promise<void> => {
  const res = YAML.load(dockerComposeYamlPath);

  console.log(chalk.magenta('docker compose up...'));
  console.time(chalk.magenta('docker-compose-up'));

  await docker.upAll({
    cwd: getIntegrationTestPath(),
    log: true,
  });

  const databaseClient = Object.keys(res.services).find((service) => relationalDatabases.includes(service));

  const dbFunctions = getDatabaseStartupFunctions(databaseClient);

  await handleDatabaseSetup(dbFunctions);
  // 👍🏼 We're ready
};

