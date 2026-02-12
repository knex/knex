require('../../util/chai-setup');
const { expect } = require('chai');
const sinon = require('sinon');

describe('formatSqlWithBindings', function () {
  let formatSqlWithBindings;

  before(async function () {
    ({ default: formatSqlWithBindings } = await import(
      '../../../docs/scripts/format-sql-bindings.mjs'
    ));
  });

  it('delegates to knex.raw when \\\\? should still be a binding placeholder', function () {
    const sql = 'select \\\\? as q';
    const rawReturn = { toString: sinon.stub().returns(`RAW:${sql}`) };
    const raw = sinon.stub().returns(rawReturn);
    const knex = {
      raw,
      client: {
        _escapeBinding: sinon
          .stub()
          .throws(new Error('unexpected escape binding')),
      },
    };
    const result = formatSqlWithBindings(sql, [1], 'sqlite3', knex);

    expect(raw).to.have.been.calledOnceWithExactly(sql, [1]);
    expect(rawReturn.toString).to.have.been.calledOnceWithExactly();
    expect(result).to.equal(`RAW:${sql}`);
  });

  it('formats bindings with a real knex instance (knex#6363)', function () {
    const knex = require('../../../knex');
    const knexInstance = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: {
        filename: ':memory:',
      },
    });

    // \\\\? in JS = \\? in the string (escaped backslash + placeholder).
    // The even backslash count means ? is a real placeholder.
    // Escape backslashes are consumed (same convention as PG positionBindings).
    const sql = 'select \\\\? as q, ? as v';
    const result = formatSqlWithBindings(sql, [1, 2], 'sqlite3', knexInstance);

    expect(result).to.equal('select 1 as q, 2 as v');
    return knexInstance.destroy();
  });

  it('ignores escaped question marks and formats numbered placeholders', function () {
    const escapeBinding = sinon.stub().callsFake((value) => `<${value}>`);
    const raw = sinon.stub();
    const knex = { raw, client: { _escapeBinding: escapeBinding } };
    const sql = 'select \\? as q, $1 as v';
    const result = formatSqlWithBindings(sql, [42], 'postgres', knex);

    expect(raw).to.not.have.been.called;
    expect(escapeBinding).to.have.been.calledOnceWithExactly(42, {});
    expect(result).to.equal('select \\? as q, <42> as v');
  });

  it('returns sql for missing or empty bindings and missing helpers', function () {
    const sql = 'select $1';
    const rawReturn = { toString: sinon.stub().returns('RAW') };
    const knexWithRawOnly = { raw: sinon.stub().returns(rawReturn) };

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
    const escapeBinding = sinon.stub().callsFake((value) => `<${value}>`);
    const raw = sinon.stub();
    const knex = { raw, client: { _escapeBinding: escapeBinding } };
    const rawObjectReturn = { toString: sinon.stub().returns('RAW:ok') };
    const knexForObject = { raw: sinon.stub().returns(rawObjectReturn) };

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
    expect(knexForObject.raw).to.have.been.calledOnceWithExactly(
      'select ? as v',
      {
        named: 'ok',
      }
    );
    expect(rawObjectReturn.toString).to.have.been.calledOnceWithExactly();
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
