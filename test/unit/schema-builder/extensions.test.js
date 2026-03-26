const MySQL_Client = require('../../../lib/dialects/mysql');
const knex = require('../../../knex');

describe('SchemaBuilder Extensions', () => {
  const client = new MySQL_Client({ client: 'mysql' });

  const functionToExtend = () => true;
  knex.SchemaBuilder.extend('tryCreateTable', functionToExtend);
  knex.TableBuilder.extend('testCol', functionToExtend);
  knex.ColumnBuilder.extend('testCol', functionToExtend);
  knex.ViewBuilder.extend('testCol', functionToExtend);

  it('schemabuilder has method', () => {
    expect(client.schemaBuilder().tryCreateTable).toBe(functionToExtend);
    expect(client.schemaBuilder().tryCreateTable()).toBe(true);
  });

  it('tablebuilder has method', () => {
    client
      .schemaBuilder()
      .createTable('users', function (table) {
        expect(table.testCol).toBe(functionToExtend);
      })
      .toSQL();
  });

  it('columnbuilder has method', () => {
    client
      .schemaBuilder()
      .createTable('users', function (table) {
        expect(table.string('t').testCol).toBe(functionToExtend);
      })
      .toSQL();
  });

  it('viewbuilder has method', () => {
    client
      .schemaBuilder()
      .createView('users', function (view) {
        expect(view.testCol).toBe(functionToExtend);
        view.as(
          knex('users')
            .join('user_roles', 'users.user_id', 'user_roles.user_id')
            .select('users.*', 'user_roles.role_code')
        );
      })
      .toSQL();
  });
});
