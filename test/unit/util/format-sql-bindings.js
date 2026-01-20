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
});
