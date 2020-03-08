'use strict';
const expect = require('chai').expect;
const knex = require('../../../knex');

describe('MSSQL unit tests', () => {
  const knexInstance = knex({
    client: 'mssql',
    connection: {
      port: 1433,
      host: '127.0.0.1',
      password: 'yourStrong(!)Password',
      user: 'sa',
    },
  });

  it('should escape statements with [] correctly', async () => {
    const sql = knexInstance('projects')
      .where('id] = 1 UNION SELECT 1, @@version -- --', 1)
      .toSQL();
    expect(sql.sql).to.equal(
      'select * from [projects] where [id = 1 UNION SELECT 1, @@version -- --] = ?'
    );
  });

  it('should escape statements with "" correctly', async () => {
    const sql = knexInstance('projects')
      .where('id]" = 1 UNION SELECT 1, @@version -- --', 1)
      .toSQL();
    expect(sql.sql).to.equal(
      'select * from [projects] where [id" = 1 UNION SELECT 1, @@version -- --] = ?'
    );
  });
});
