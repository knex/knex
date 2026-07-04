'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;

const { withTempDir, migration, migrate } = require('./tempfiles');
const knex = require('../../lib');

describe('CLI migrate:to and migrate:before', () => {
  describe('migrate:to', () => {
    it('should run all migrations up to and including the specified one', async () => {
      await withTempDir(async (dir, tempfile) => {
        await tempfile(
          '01.js',
          migration({
            up: async (knex) => {
              await knex.schema.createTable('tbl1', (tb) => {
                tb.increments('id');
              });
            },
            down: async (knex) => {
              await knex.schema.dropTable('tbl1');
            },
          })
        );

        await tempfile(
          '02.js',
          migration({
            up: async (knex) => {
              await knex.schema.createTable('tbl2', (tb) => {
                tb.increments('id');
              });
            },
            down: async (knex) => {
              await knex.schema.dropTable('tbl2');
            },
          })
        );

        await tempfile(
          '03.js',
          migration({
            up: async (knex) => {
              await knex.schema.createTable('tbl3', (tb) => {
                tb.increments('id');
              });
            },
            down: async (knex) => {
              await knex.schema.dropTable('tbl3');
            },
          })
        );

        const dbfile = await tempfile('db.sqlite');

        const db = knex({
          client: 'sqlite3',
          connection: { filename: dbfile },
          useNullAsDefault: true,
        });

        try {
          await expect(migrate('to', dir, dbfile, 'knex-test-02.js')).to
            .eventually.be.fulfilled;

          await expect(db.select('*').from('tbl1')).to.eventually.be.fulfilled;
          await expect(db.select('*').from('tbl2')).to.eventually.be.fulfilled;
          await expect(
            db.select('*').from('tbl3')
          ).to.eventually.be.rejectedWith(/no such table/);
        } finally {
          await db.destroy();
        }
      });
    });
  });

  describe('migrate:before', () => {
    it('should run all migrations before the specified one (exclusive)', async () => {
      await withTempDir(async (dir, tempfile) => {
        await tempfile(
          '01.js',
          migration({
            up: async (knex) => {
              await knex.schema.createTable('tbl1', (tb) => {
                tb.increments('id');
              });
            },
            down: async (knex) => {
              await knex.schema.dropTable('tbl1');
            },
          })
        );

        await tempfile(
          '02.js',
          migration({
            up: async (knex) => {
              await knex.schema.createTable('tbl2', (tb) => {
                tb.increments('id');
              });
            },
            down: async (knex) => {
              await knex.schema.dropTable('tbl2');
            },
          })
        );

        await tempfile(
          '03.js',
          migration({
            up: async (knex) => {
              await knex.schema.createTable('tbl3', (tb) => {
                tb.increments('id');
              });
            },
            down: async (knex) => {
              await knex.schema.dropTable('tbl3');
            },
          })
        );

        const dbfile = await tempfile('db.sqlite');

        const db = knex({
          client: 'sqlite3',
          connection: { filename: dbfile },
          useNullAsDefault: true,
        });

        try {
          await expect(migrate('before', dir, dbfile, 'knex-test-03.js')).to
            .eventually.be.fulfilled;

          await expect(db.select('*').from('tbl1')).to.eventually.be.fulfilled;
          await expect(db.select('*').from('tbl2')).to.eventually.be.fulfilled;
          await expect(
            db.select('*').from('tbl3')
          ).to.eventually.be.rejectedWith(/no such table/);
        } finally {
          await db.destroy();
        }
      });
    });
  });
});
