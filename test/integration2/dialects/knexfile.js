const dotenv = require('dotenv');
const env = require('env-var');

dotenv.config({ path: '.test.env' });

const DB_CONFIG = env.get('DB_CONFIG').required().asJsonObject();

module.exports = {
  client: 'pg',
  connection: {
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    port: DB_CONFIG.port,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: 'migrations',
  },
  seeds: {
    directory: './seeds/dev.js',
  },
  timezone: 'UTC',
};
