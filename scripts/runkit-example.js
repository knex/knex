require('sqlite3');
const Knex = require('knex');

const knexSqlite = Knex({
  client: 'sqlite',
  connection: ':memory:',
});

const knexMysql = Knex({
  client: 'mysql2',
});

const knexPg = Knex({
  client: 'pg',
});

(async function run() {
  await knexSqlite.schema.createTable('test', (t) => {
    t.increments('id').primary();
    t.string('data');
  });

  await knexSqlite('test').insert([{ data: 'foo' }, { data: 'bar' }]);

  console.log('test table data:', await knexSqlite('test'));

  console.log(
    knexPg({ f: 'foo', b: 'bar' })
      .select('foo.*')
      .where('f.name', knexPg.raw('??', ['b.name']))
      .whereIn('something', knexPg('bar').select('id'))
      .toSQL().sql
  );
})();
