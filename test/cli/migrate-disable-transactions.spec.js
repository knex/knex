'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;

const { withTempDir, migration, migrate } = require('./tempfiles');
const knex = require('../../lib');

describe('CLI tests (2)', () => {
  for (const subcommand of ['up', 'latest']) {
    describe(`migrate:${subcommand}`, () => {
      it(`respects --disable-transactions`, async () => {
        await withTempDir(async (dir, tempfile) => {
          await tempfile(
            '01.js',
            migration({
              up: async (knex) => {
                await knex.schema.createTable('foo', (tb) => {
                  tb.increments('id');
                });
                await knex.insert({ id: 1 }).into('foo');

                await knex.raw('oh noes');
              },
              down: () => {},
            })
          );

          const dbfile = await tempfile('db.sqlite');

          /** @type {import('../../types/index').Knex} db */
          const db = knex({
            client: 'sqlite3',
            connection: {
              filename: dbfile,
            },
            useNullAsDefault: true,
          });
          try {
            // migrations in transaction -- should leave the db clean
            await expect(
              migrate(subcommand, dir, dbfile)
            ).to.eventually.be.rejectedWith(/migration failed.*oh noes/);

            await expect(
              db.select('*').from('foo')
            ).to.eventually.be.rejectedWith(/no such table/);

            // migrations without transaction -- should leave the db dirty
            await expect(
              migrate(subcommand, dir, dbfile, '--disable-transactions')
            ).to.eventually.be.rejectedWith(/migration failed.*oh noes/);

            await expect(
              db.select('*').from('foo')
            ).to.eventually.be.fulfilled.and.deep.equal([{ id: 1 }]);
          } finally {
            await db.destroy();
          }
        });
      });
    });
  }

  for (const subcommand of ['down', 'rollback']) {
    describe(`migrate:${subcommand}`, () => {
      it(`respects --disable-transactions`, async () => {
        await withTempDir(async (dir, tempfile) => {
          await tempfile(
            '01.js',
            migration({
              up: async (knex) => {
                await knex.schema.createTable('foo', (tb) => {
                  tb.increments('id');
                });
                await knex.insert({ id: 1 }).into('foo');
              },
              down: async (knex) => {
                await knex.schema.dropTable('foo');
                await knex.raw('oh noes');
              },
            })
          );

          const dbfile = await tempfile('db.sqlite');

          /** @type {import('../../types/index').Knex} db */
          const db = knex({
            client: 'sqlite3',
            connection: {
              filename: dbfile,
            },
            useNullAsDefault: true,
          });
          try {
            // migrations in transaction -- should leave the db clean
            await expect(migrate('up', dir, dbfile)).to.eventually.be.fulfilled;

            await expect(
              migrate(subcommand, dir, dbfile)
            ).to.eventually.be.rejectedWith(/migration failed.*oh noes/);

            await expect(
              db.select('*').from('foo')
            ).to.eventually.be.fulfilled.and.deep.equal([{ id: 1 }]);

            // migrations without transaction -- should leave the db dirty
            await expect(
              migrate(subcommand, dir, dbfile, '--disable-transactions')
            ).to.eventually.be.rejectedWith(/migration failed.*oh noes/);

            await expect(
              db.select('*').from('foo')
            ).to.eventually.be.rejectedWith(/no such table/);
          } finally {
            await db.destroy();
          }
        });
      });
    });
  }
});
