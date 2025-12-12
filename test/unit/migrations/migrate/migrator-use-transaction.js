const { expect } = require('chai');
const { DRIVER_NAMES } = require('../../../util/constants');
const { isBoolean } = require('../../../../lib/util/is');
const { Migrator } = require('../../../../lib/migrations/migrate/Migrator');
const { getDriverName } = require('../../../util/db-helpers');

describe('Migrator', () => {
  describe('_useTransaction', () => {
    const mockKnex = (driverName) => ({
      client: { driverName },
    });

    // eslint-disable-next-line no-undef
    const knexSqlite = mockKnex(DRIVER_NAMES.SQLite);
    const knexNotSqlite = mockKnex('no such thing');

    const mockMigrationContent = (transaction) => {
      const content = {
        up: () => {},
        down: () => {},
      };
      if (transaction !== undefined) {
        content.config = { transaction };
      }
      return content;
    };

    const table1 = [
      // true is default
      { local: undefined, global: undefined, expected: true },

      // use global if present
      { local: undefined, global: true, expected: true },
      { local: undefined, global: false, expected: false },

      // local overrides global
      { local: true, global: undefined, expected: true },
      { local: true, global: true, expected: true },
      { local: true, global: false, expected: true },

      // local overrides global
      { local: false, global: undefined, expected: false },
      { local: false, global: true, expected: false },
      { local: false, global: false, expected: false },
    ];

    // verify previous behavior
    table1.forEach(({ local, global, expected }) => {
      const allTransactionsDisabled = isBoolean(global) ? !global : undefined;
      it(`allTransactionsDisabled=${allTransactionsDisabled} config.transactions=${local} _useTransaction() = ${expected}`, () => {
        const migrationContent = mockMigrationContent(local);
        const mocked = {
          knex: knexNotSqlite,
        };
        const result = Migrator.prototype._useTransaction.call(
          mocked,
          migrationContent,
          allTransactionsDisabled
        );
        expect(result).to.equal(expected);
      });
    });

    const table2 = [
      // when using sqlite, no transactions
      { knex: knexSqlite, global: undefined, expected: false },
      { knex: knexSqlite, global: true, expected: false },
      { knex: knexSqlite, global: false, expected: false },

      // when not using sqlite, use the global value
      { knex: knexNotSqlite, global: undefined, expected: true },
      { knex: knexNotSqlite, global: true, expected: true },
      { knex: knexNotSqlite, global: false, expected: false },
    ];

    // verify conditional behavior
    table2.forEach(({ knex, global, expected }) => {
      const allTransactionsDisabled = isBoolean(global) ? !global : undefined;
      it(`driver=${getDriverName(
        knex
      )} allTransactionsDisabled=${allTransactionsDisabled} config.transactions='false_if_sqlite' _useTransaction() = ${expected}`, () => {
        const migrationContent = mockMigrationContent('false_if_sqlite');
        const mocked = { knex };
        const result = Migrator.prototype._useTransaction.call(
          mocked,
          migrationContent,
          allTransactionsDisabled
        );
        expect(result).to.equal(expected);
      });
    });
  });
});
