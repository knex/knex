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
    expect(() => compiler.dropUniqueIfExists()).toThrow(
      /implemented in the dialect driver/
    );
  });

  it('dropForeignIfExists throws by default', () => {
    const compiler = createCompiler();
    expect(() => compiler.dropForeignIfExists()).toThrow(
      /implemented in the dialect driver/
    );
  });

  it('dropPrimaryIfExists throws by default', () => {
    const compiler = createCompiler();
    expect(() => compiler.dropPrimaryIfExists()).toThrow(
      /implemented in the dialect driver/
    );
  });

  it('dropUnique throws by default', () => {
    const compiler = createCompiler();
    expect(() => compiler.dropUnique()).toThrow(
      /implemented in the dialect driver/
    );
  });

  it('dropForeign throws by default', () => {
    const compiler = createCompiler();
    expect(() => compiler.dropForeign()).toThrow(
      /implemented in the dialect driver/
    );
  });
});
