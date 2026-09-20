const { expect } = require('chai');
const Formatter = require('../../../lib/formatter');
const {
  getAliasSeparatorIndex,
  unwrapFullyQuotedIdentifier,
} = require('../../../lib/formatter/wrappingFormatter');
const Client = require('../../../lib/client');
const SQLite3_Client = require('../../../lib/dialects/sqlite3');

describe('formatter', () => {
  const queryContext = () => {
    return {};
  };
  const client = new Client({ client: 'generic' });
  const formatter = new Formatter(client, { queryContext });

  it('correctly handles single column value', () => {
    const columns = formatter.columnize('columnName');
    expect(columns).to.equal('"columnName"');
  });

  it('correctly handles multiple column values', () => {
    const columns = formatter.columnize(['columnName1', 'columnName2']);
    expect(columns).to.equal('"columnName1", "columnName2"');
  });

  it('correctly handles null', () => {
    const columns = formatter.columnize(null);
    expect(columns).to.equal('');
  });

  it('correctly handles empty array', () => {
    const columns = formatter.columnize([]);
    expect(columns).to.equal('');
  });

  it('correctly handles dotted identifiers with case-insensitive aliases', () => {
    const wrapped = formatter.wrap('schema.table AS alias');
    expect(wrapped).to.equal('"schema"."table" as "alias"');
  });

  it('does not split quoted sqlite identifiers that contain dots (#2762)', () => {
    const sqliteClient = new SQLite3_Client({
      client: 'sqlite3',
      useNullAsDefault: true,
    });
    const sqliteFormatter = new Formatter(sqliteClient, { queryContext });

    expect(sqliteFormatter.wrap('"my.table.name"')).to.equal('`my.table.name`');
    expect(sqliteFormatter.wrap('`my.table.name`')).to.equal('`my.table.name`');
    expect(sqliteFormatter.wrap('[my.table.name]')).to.equal('`my.table.name`');
    expect(sqliteFormatter.wrap('"my.table.name" as t')).to.equal(
      '`my.table.name` as `t`'
    );
    expect(sqliteFormatter.wrap('schema.table')).to.equal('`schema`.`table`');
  });

  describe('unwrapFullyQuotedIdentifier', () => {
    it('unwraps a single quoted identifier', () => {
      expect(unwrapFullyQuotedIdentifier('"my.table.name"')).to.equal(
        'my.table.name'
      );
      expect(unwrapFullyQuotedIdentifier('`my.table.name`')).to.equal(
        'my.table.name'
      );
      expect(unwrapFullyQuotedIdentifier('[my.table.name]')).to.equal(
        'my.table.name'
      );
      expect(unwrapFullyQuotedIdentifier('"foo""bar.baz"')).to.equal(
        'foo"bar.baz'
      );
    });

    it('returns null when the value is not a single quoted identifier', () => {
      expect(unwrapFullyQuotedIdentifier('my.table.name')).to.equal(null);
      expect(unwrapFullyQuotedIdentifier('"schema"."table"')).to.equal(null);
      expect(unwrapFullyQuotedIdentifier('"unclosed')).to.equal(null);
      expect(unwrapFullyQuotedIdentifier('')).to.equal(null);
    });
  });

  describe('getAliasSeparatorIndex', () => {
    it('finds aliases case-insensitively', () => {
      expect(getAliasSeparatorIndex('foo as bar')).to.equal(3);
      expect(getAliasSeparatorIndex('foo AS bar')).to.equal(3);
      expect(getAliasSeparatorIndex('foo aS bar')).to.equal(3);
    });

    it('only treats as as an alias when surrounded by spaces', () => {
      expect(getAliasSeparatorIndex('foo asbar')).to.equal(-1);
      expect(getAliasSeparatorIndex('fooas bar')).to.equal(-1);
      expect(getAliasSeparatorIndex('foo As.bar')).to.equal(-1);
    });
  });
});
