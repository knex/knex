'use strict';

const { TEST_TIMESTAMP } = require('../../util/constants');

module.exports = function (knex) {
  describe('Deletes', function () {
    it('should handle deletes', function () {
      return knex('accounts')
        .where('id', 1)
        .del()
        .testSql(function (tester) {
          tester('mysql', 'delete from `accounts` where `id` = ?', [1], 1);
          tester('pg', 'delete from "accounts" where "id" = ?', [1], 1);
          tester(
            'pg-redshift',
            'delete from "accounts" where "id" = ?',
            [1],
            1
          );
          tester('sqlite3', 'delete from `accounts` where `id` = ?', [1], 1);
          tester('oracledb', 'delete from "accounts" where "id" = ?', [1], 1);
          tester(
            'mssql',
            'delete from [accounts] where [id] = ?;select @@rowcount',
            [1],
            1
          );
        });
    });

    it('should allow returning for deletes in postgresql and mssql', function () {
      return knex('accounts')
        .where('id', 2)
        .del('*')
        .testSql(function (tester) {
          tester('mysql', 'delete from `accounts` where `id` = ?', [2], 1);
          tester(
            'pg',
            'delete from "accounts" where "id" = ? returning *',
            [2],
            [
              {
                id: '2',
                first_name: 'Test',
                last_name: 'User',
                email: 'test2@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
              },
            ]
          );
          tester(
            'pg-redshift',
            'delete from "accounts" where "id" = ?',
            [2],
            1
          );
          tester('sqlite3', 'delete from `accounts` where `id` = ?', [2], 1);
          tester('oracledb', 'delete from "accounts" where "id" = ?', [2], 1);
          tester(
            'mssql',
            'delete from [accounts] output deleted.* where [id] = ?',
            [2],
            [
              {
                id: '2',
                first_name: 'Test',
                last_name: 'User',
                email: 'test2@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
              },
            ]
          );
        });
    });
    it('#4152 Should allow returns with deletes on tables with triggers', async function () {
      if (knex.client.driverName !== 'mssql') {
        return true;
      }

      return await knex.transaction(async function () {
        // Reused variables
        const primaryTable = 'test_return_with_trigger_primary';
        const secondaryTable = 'test_return_with_trigger_secondary';
        const primaryLink = 'foreign_id';
        const secondaryLink = 'looping_id';
        const triggerName = 'tr_test_return_with_trigger';
        let insertedId;
        let deletedId;

        async function setup() {
          // Build test tables
          await knex.schema.createTable(primaryTable, function (table) {
            table.increments();
            table.string("data");
            table.integer(primaryLink);
          });

          await knex.schema.createTable(secondaryTable, function (table) {
            table.increments();
            table.string("data");
            table.integer(secondaryLink);
          });

          // Create trigger
          await knex.raw(`
            GO
            /****** Object:  Trigger [dbo].[${triggerName}]    Script Date: 12/9/2020 10:52:56 AM ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TRIGGER [dbo].[${triggerName}] ON [dbo].[${secondaryTable}]
              AFTER DELETE
            AS 
            BEGIN
              -- SET NOCOUNT ON added to prevent extra result sets from
              -- interfering with SELECT statements.
              SET NOCOUNT ON;

              BEGIN
                delete pt
                where id = d.${secondaryLink}
              END
            END
          `);
        }

        async function insertWithReturn() {
          // Setup primary table for trigger use case
          const primaryId = await knex(primaryTable).insert([insertPrimary], ["id"]);
          insertSecondary[secondaryLink] = primaryId[0];

          // Insert to table with trigger to test delete
          insertedId = await knex(secondaryTable).insert([insertSecondary], ["id"]);
        }

        async function deleteTriggerTable() {
          // Test returning value from delete statement on a table with a trigger
          deletedId = await knex(secondaryTable).whereRaw(`id = ${insertedId}`).delete(["id"]);
        }

        async function cleanup() {
          // Delete the tables
          await knex.schema.dropTable(primaryTable);
          await knex.schema.dropTable(secondaryTable);
        }

        await setup();
        await insertWithReturn();
        await deleteTriggerTable();
        await cleanup();

        expect(deletedId).to.be.finite;
      });
    });
  });
};
