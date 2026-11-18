const { expect } = require('chai');
const Formatter = require('../../../lib/formatter');
const {
  getAliasSeparatorIndex,
} = require('../../../lib/formatter/wrappingFormatter');
const Client = require('../../../lib/client');

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

describe('unwrapRaw bindings', () => {
  const MySQL_Client = require('../../../lib/dialects/mysql');
  const knex = require('../../../knex')(new MySQL_Client({ client: 'mysql' }));
  const ids = Array.from({ length: 200000 }, (_, i) => i + 1);

  it('merges bindings from a union subquery in from() without an argument spread', () => {
    const union = knex
      .from({ a: 'edges' })
      .select('a.child_id')
      .whereIn('a.parent_id', ids)
      .union(
        knex
          .from({ b: 'edges' })
          .select('b.child_id')
          .whereIn('b.parent_id', ids)
      );
    const { bindings } = knex
      .from(union.as('reachable'))
      .select('reachable.child_id')
      .toSQL();
    expect(bindings).to.have.lengthOf(ids.length * 2);
    expect(bindings[0]).to.equal(1);
    expect(bindings[bindings.length - 1]).to.equal(ids.length);
  });

  it('merges bindings from a raw where clause without an argument spread', () => {
    const { bindings } = knex
      .from('t')
      .where(knex.raw(`id in (${ids.map(() => '?').join(',')})`, ids))
      .toSQL();
    expect(bindings).to.have.lengthOf(ids.length);
    expect(bindings[0]).to.equal(1);
    expect(bindings[bindings.length - 1]).to.equal(ids.length);
  });
});
