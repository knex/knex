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

      // As it stands, this throws an error
      xit('Should correctly interpret string literal in JSONB raw SQL', async () => {
        const binding = 'bar_bind';
        const k = knex2.select('*')
          .from('users')
          .whereRaw('json_key.json_value @\\? \'$.*.bar \\? (@ == "?")\'', binding);

        await k;
      });

      // https://github.com/knex/knex/issues/6011
      // This works without pg-format
      it('Should correctly map json key & value in JSONB raw SQL', async () => {
        const binding = ['json_key', 'json_value'];
        const k = knex2.select('*')
          .from('users')
          .where('id', '=', 1)
          .whereRaw('?? \\? ?', binding)

        // console.log({ toSQL: k.toSQL(), toQuery: k.toQuery() });
        const r = await k;
        console.log(r, 'r');
      });
    });
  });
});
