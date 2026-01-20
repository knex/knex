const { expect } = require('chai');

describe('formatSqlWithBindings', function () {
  let formatSqlWithBindings;

  before(async function () {
    ({ default: formatSqlWithBindings } = await import(
      '../../../docs/scripts/format-sql-bindings.mjs'
    ));
  });

  it('treats ? after an escaped backslash as a binding placeholder', function () {
    const rawCalls = [];
    const knex = {
      raw: (sql, bindings) => {
        rawCalls.push({ sql, bindings });
        return { toString: () => `RAW:${sql}` };
      },
      client: {
        _escapeBinding: () => {
          throw new Error('unexpected escape binding');
        },
      },
    };
    const sql = 'select \\\\? as q';
    const result = formatSqlWithBindings(sql, [1], 'sqlite3', knex);

    expect(rawCalls).to.have.lengthOf(1);
    expect(rawCalls[0]).to.deep.equal({ sql, bindings: [1] });
    expect(result).to.equal(`RAW:${sql}`);
  });

  it('ignores escaped question marks and formats numbered placeholders', function () {
    const rawCalls = [];
    const knex = {
      raw: () => {
        rawCalls.push(true);
        return { toString: () => 'RAW' };
      },
      client: {
        _escapeBinding: (value) => `<${value}>`,
      },
    };
    const sql = 'select \\? as q, $1 as v';
    const result = formatSqlWithBindings(sql, [42], 'postgres', knex);

    expect(rawCalls).to.have.lengthOf(0);
    expect(result).to.equal('select \\? as q, <42> as v');
  });

  it('returns sql for missing or empty bindings and missing helpers', function () {
    const sql = 'select $1';
    const knexWithRawOnly = { raw: () => ({ toString: () => 'RAW' }) };

    expect(
      formatSqlWithBindings(sql, null, 'postgres', knexWithRawOnly)
    ).to.equal(sql);
    expect(
      formatSqlWithBindings(sql, [], 'postgres', knexWithRawOnly)
    ).to.equal(sql);
    expect(
      formatSqlWithBindings(sql, {}, 'postgres', knexWithRawOnly)
    ).to.equal(sql);
    expect(
      formatSqlWithBindings(sql, 123, 'postgres', knexWithRawOnly)
    ).to.equal(sql);

    expect(formatSqlWithBindings(sql, [1], 'postgres', {})).to.equal(sql);
    expect(
      formatSqlWithBindings(sql, [1], 'postgres', knexWithRawOnly)
    ).to.equal(sql);
  });

  it('formats colon/at placeholders and falls back when no replacement is possible', function () {
    const knex = {
      raw: () => {
        throw new Error('unexpected raw');
      },
      client: {
        _escapeBinding: (value) => `<${value}>`,
      },
    };
    const knexForObject = {
      raw: (sql, bindings) => ({ toString: () => `RAW:${bindings.named}` }),
    };

    expect(
      formatSqlWithBindings('select :1 as v', [7], 'oracle', knex)
    ).to.equal('select <7> as v');
    expect(
      formatSqlWithBindings('select @p0 as v', [8], 'mssql', knex)
    ).to.equal('select <8> as v');
    expect(
      formatSqlWithBindings(
        'select ? as v',
        { named: 'ok' },
        'sqlite3',
        knexForObject
      )
    ).to.equal('RAW:ok');
    expect(
      formatSqlWithBindings('select $2 as v', [9], 'postgres', knex)
    ).to.equal('select $2 as v');
    expect(
      formatSqlWithBindings('select 1 as v', [10], 'sqlite3', knex)
    ).to.equal('select 1 as v');
  });

  it('throws for missing or unknown dialects', function () {
    expect(() =>
      formatSqlWithBindings('select 1', [1], null, { raw: () => ({}) })
    ).to.throw('formatSqlWithBindings requires a dialect');

    expect(() =>
      formatSqlWithBindings('select 1', [1], 'unknown', { raw: () => ({}) })
    ).to.throw('Unknown dialect for SQL bindings: unknown');
  });
});
