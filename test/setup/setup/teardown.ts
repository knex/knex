import chalk from 'chalk';
import { execSync } from 'child_process';

console.time(chalk.magenta('global-teardown'));
execSync('docker compose down --volumes', {
  cwd: `${process.cwd()}/tests/integration/setup`,
});
console.timeEnd(chalk.magenta('global-teardown'));
