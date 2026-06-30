const { randomUUID } = require('crypto');

async function genericSchemaCreation(knex, schemaName) {
  switch (knex.client.dialect) {
    case 'mssql':
      return knex.raw(
        `IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = :schemaName)
          BEGIN
              EXEC('CREATE SCHEMA :schemaName:');
          END`,
        { schemaName }
      );
    case 'postgresql':
      return knex.raw(`CREATE SCHEMA IF NOT EXISTS :schemaName:;`, {
        schemaName,
      });
    case 'mysql':
      // note that in mysql, schema is synonymous with database
      return knex.raw(`CREATE SCHEMA IF NOT EXISTS :schemaName:;`, {
        schemaName,
      });
    case 'oracle':
      return knex
        .raw(`CREATE USER :dbUser: IDENTIFIED BY :password:`, {
          dbUser: schemaName,
          // just using a random uuid to be the password for the moment...
          password: randomUUID().substring(0, 16),
        })
        .then(() =>
          knex.raw(`GRANT CONNECT, RESOURCE TO :dbUser:`, {
            dbUser: schemaName,
          })
        )
        .then(() => {
          knex.raw(`GRANT UNLIMITED TABLESPACE TO :dbUser:`, {
            dbUser: schemaName,
          });
        });
    default:
      throw Error('Unsupported dialect: ' + knex.client.dialect)
  }
}

function genericSchemaDeletion(knex, schemaName) {
  switch (knex.client.dialect) {
    case 'mssql':
      return knex.raw(
        `IF EXISTS (SELECT 1 FROM sys.schemas WHERE name = :schemaName)
          BEGIN
              EXEC('DROP SCHEMA :schemaName:');
          END`,
        { schemaName }
      );
    case 'postgresql':
    case 'mysql':
      return knex.raw(`'DROP SCHEMA IF EXISTS :schemaName:';`, { schemaName });
    case 'oracle':
      return knex.raw(`DROP USER :dbUser:`, {
        dbUser: schemaName,
      });
    default:
      throw Error('Unsupported dialect: ' + knex.client.dialect)
    }
}

exports.up = function up(knex) {
  return genericSchemaCreation(knex, 'testSchema');
};

exports.down = function down(knex) {
  return genericSchemaDeletion(knex, 'testSchema');
};
