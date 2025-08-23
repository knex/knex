const knex = require('../../../lib');

describe.only('Postgres dialect', () => {
  describe('Connection configuration', () => {
    describe('Postgres', () => {
      let knex2;
      before(() => {
        knex2 = knex({
          client: 'pg',
          connection: {
            host: '0.0.0.0',
            port: 54310,
            user: 'myuser',
            password: 'myuserpassword',
            database: 'postgres_knex_db',
          },
        });
      });

      it.only('Should correctly escape JSONB raw SQL', async () => {
        const binding = 'bar_bind';
        const k = knex2.select('*')
          .from('users')
          .whereRaw('json_key.json_value @\\? \'$.*.bar \\? (@ == "?")\'', binding);

        console.log({ toSQL: k.toSQL(), toQuery: k.toQuery() });
        const r = await k;
        console.log(r, 'r');
      });

      // https://github.com/knex/knex/issues/6011
      // This works without pg-format
      it.only('Should correctly escape JSONB raw SQL', async () => {
        const binding = ['json_key', 'json_value'];
        const k = knex2.select('*')
          .from('users')
          .where('id', '=', 1)
          .whereRaw('?? \\? ?', binding)

        console.log({ toSQL: k.toSQL(), toQuery: k.toQuery() });
        const r = await k;
        // console.log(r, 'r');
      });


      // it.only('Should correctly escape JSONB raw SQL', async () => {
      //   // const binding = ['json_key', 'json_value'];
      //   const k = knex2.select('*')
      //     .from('users')
      //     .where('id', '=', 1)
      //     .whereJsonPath('json_key', '$.json_value', 'json_value')

      //   console.log({ toSQL: k.toSQL(), toQuery: k.toQuery() });
      //   const r = await k;
      //   // console.log(r, 'r');
      // });

      it('uses correct port for connecting', async () => {
        const binding = { foo: 'foo' };
        const k = knex2.raw(
          `select 'string with a question mark ?', 'string with a named binding :foo';`, binding
          );

        console.log({ toSQL: k.toSQL(), toQuery: k.toQuery() });
        const r = await k;
        // console.log(r, 'r');
      });
    });
  });
});
