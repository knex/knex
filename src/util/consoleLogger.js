/* eslint no-console:0 */
import chalk from 'chalk'

export default {
  error(msg) {
    console.log(chalk.red(`Knex:Error ${msg}`))
  },
  warn(msg) {
    console.log(chalk.yellow(`Knex:warning - ${msg}`))
  }
}
