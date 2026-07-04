'use strict';

const { expect } = require('chai');
const TableCompiler = require('../../../lib/schema/tablecompiler');

describe('Base TableCompiler', () => {
  function createCompiler() {
    const tableBuilder = {
      _method: 'create',
      _schemaName: null,
      _tableName: 'test_table',
      _tableNameLike: null,
      _single: {},
      _statements: [],
      queryContext() {
        return undefined;
      },
    };
    const client = {
      formatter() {
        return {};
      },
      config: {},
    };
    return new TableCompiler(client, tableBuilder);
  }

  it('dropUniqueIfExists throws by default', () => {
    const compiler = createCompiler();
    expect(() => compiler.dropUniqueIfExists()).to.throw(
      /implemented in the dialect driver/
    );
  });

  it('dropForeignIfExists throws by default', () => {
    const compiler = createCompiler();
    expect(() => compiler.dropForeignIfExists()).to.throw(
      /implemented in the dialect driver/
    );
  });

  it('dropPrimaryIfExists throws by default', () => {
    const compiler = createCompiler();
    expect(() => compiler.dropPrimaryIfExists()).to.throw(
      /implemented in the dialect driver/
    );
  });

  it('dropUnique throws by default', () => {
    const compiler = createCompiler();
    expect(() => compiler.dropUnique()).to.throw(
      /implemented in the dialect driver/
    );
  });

  it('dropForeign throws by default', () => {
    const compiler = createCompiler();
    expect(() => compiler.dropForeign()).to.throw(
      /implemented in the dialect driver/
    );
  });
});
