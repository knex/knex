const { expect } = require('chai');
const sinon = require('sinon');
const {
  makeKnexWithRawReturn,
  makeKnexWithClient,
  makeEscapeBinding,
} = require('../../util/format-sql-bindings-helpers');

describe('formatSqlWithBindings', function () {
  let formatSqlWithBindings;

  before(async function () {
    ({ default: formatSqlWithBindings } = await import(
      '../../../docs/scripts/format-sql-bindings.mjs'
    ));
  });

  it('treats ? after an escaped backslash as a binding placeholder', function () {
    const sql = 'select \\\\? as q';
    const { knex, raw } = makeKnexWithRawReturn(`RAW:${sql}`);
    knex.client = {
      _escapeBinding: sinon.stub().throws(new Error('unexpected escape binding')),
    };
    const result = formatSqlWithBindings(sql, [1], 'sqlite3', knex);

    expect(raw).to.have.been.calledOnceWithExactly(sql, [1]);
    expect(result).to.equal(`RAW:${sql}`);
  });

  it('ignores escaped question marks and formats numbered placeholders', function () {
    const escapeBinding = makeEscapeBinding();
    const { knex, raw } = makeKnexWithClient(escapeBinding);
    const sql = 'select \\? as q, $1 as v';
    const result = formatSqlWithBindings(sql, [42], 'postgres', knex);

    expect(raw).to.not.have.been.called;
    expect(escapeBinding).to.have.been.calledOnceWithExactly(42, {});
    expect(result).to.equal('select \\? as q, <42> as v');
  });

  it('returns sql for missing or empty bindings and missing helpers', function () {
    const sql = 'select $1';
    const { knex: knexWithRawOnly } = makeKnexWithRawReturn('RAW');

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
    const escapeBinding = makeEscapeBinding();
    const { knex, raw } = makeKnexWithClient(escapeBinding);
    const knexForObject = {
      raw: sinon
        .stub()
        .callsFake((sql, bindings) => ({
          toString: sinon.stub().returns(`RAW:${bindings.named}`),
        })),
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
    expect(raw).to.not.have.been.called;
  });

  it('throws for missing or unknown dialects', function () {
    const raw = sinon.stub();
    expect(() =>
      formatSqlWithBindings('select 1', [1], null, { raw })
    ).to.throw('formatSqlWithBindings requires a dialect');

    expect(() =>
      formatSqlWithBindings('select 1', [1], 'unknown', { raw })
    ).to.throw('Unknown dialect for SQL bindings: unknown');
  });
});
