describe('formatSqlWithBindings', function () {
  let formatSqlWithBindings;

  beforeAll(async function () {
    ({ default: formatSqlWithBindings } = await import(
      '../../../docs/scripts/format-sql-bindings.mjs'
    ));
  });

  it('delegates to knex.raw when \\\\? should still be a binding placeholder', function () {
    const sql = 'select \\\\? as q';
    const rawReturn = { toString: vi.fn().mockReturnValue(`RAW:${sql}`) };
    const raw = vi.fn().mockReturnValue(rawReturn);
    const knex = {
      raw,
      client: {
        _escapeBinding: vi
          .fn()
          .mockImplementation(() => {
            throw new Error('unexpected escape binding');
          }),
      },
    };
    const result = formatSqlWithBindings(sql, [1], 'sqlite3', knex);

    expect(raw).toHaveBeenCalledOnce();
    expect(raw).toHaveBeenCalledWith(sql, [1]);
    expect(rawReturn.toString).toHaveBeenCalledOnce();
    expect(rawReturn.toString).toHaveBeenCalledWith();
    expect(result).toBe(`RAW:${sql}`);
  });

  /* istanbul ignore next */
  it.skip('formats bindings with a real knex instance (knex#6363)', function () {
    // This will work when the escaping bug is fixed:
    // https://github.com/knex/knex/issues/6363
    const knex = require('../../../knex');
    const knexInstance = knex({
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: {
        filename: ':memory:',
      },
    });

    const sql = 'select \\\\? as q, ? as v';
    const result = formatSqlWithBindings(sql, [1, 2], 'sqlite3', knexInstance);

    expect(result).toBe('select \\\\1 as q, 2 as v');
    return knexInstance.destroy();
  });

  it('ignores escaped question marks and formats numbered placeholders', function () {
    const escapeBinding = vi.fn().mockImplementation((value) => `<${value}>`);
    const raw = vi.fn();
    const knex = { raw, client: { _escapeBinding: escapeBinding } };
    const sql = 'select \\? as q, $1 as v';
    const result = formatSqlWithBindings(sql, [42], 'postgres', knex);

    expect(raw).not.toHaveBeenCalled();
    expect(escapeBinding).toHaveBeenCalledOnce();
    expect(escapeBinding).toHaveBeenCalledWith(42, {});
    expect(result).toBe('select \\? as q, <42> as v');
  });

  it('returns sql for missing or empty bindings and missing helpers', function () {
    const sql = 'select $1';
    const rawReturn = { toString: vi.fn().mockReturnValue('RAW') };
    const knexWithRawOnly = { raw: vi.fn().mockReturnValue(rawReturn) };

    expect(
      formatSqlWithBindings(sql, null, 'postgres', knexWithRawOnly)
    ).toBe(sql);
    expect(
      formatSqlWithBindings(sql, [], 'postgres', knexWithRawOnly)
    ).toBe(sql);
    expect(
      formatSqlWithBindings(sql, {}, 'postgres', knexWithRawOnly)
    ).toBe(sql);
    expect(
      formatSqlWithBindings(sql, 123, 'postgres', knexWithRawOnly)
    ).toBe(sql);

    expect(formatSqlWithBindings(sql, [1], 'postgres', {})).toBe(sql);
    expect(
      formatSqlWithBindings(sql, [1], 'postgres', knexWithRawOnly)
    ).toBe(sql);
  });

  it('formats colon/at placeholders and falls back when no replacement is possible', function () {
    const escapeBinding = vi.fn().mockImplementation((value) => `<${value}>`);
    const raw = vi.fn();
    const knex = { raw, client: { _escapeBinding: escapeBinding } };
    const rawObjectReturn = { toString: vi.fn().mockReturnValue('RAW:ok') };
    const knexForObject = { raw: vi.fn().mockReturnValue(rawObjectReturn) };

    expect(
      formatSqlWithBindings('select :1 as v', [7], 'oracle', knex)
    ).toBe('select <7> as v');
    expect(
      formatSqlWithBindings('select @p0 as v', [8], 'mssql', knex)
    ).toBe('select <8> as v');
    expect(
      formatSqlWithBindings(
        'select ? as v',
        { named: 'ok' },
        'sqlite3',
        knexForObject
      )
    ).toBe('RAW:ok');
    expect(knexForObject.raw).toHaveBeenCalledOnce();
    expect(knexForObject.raw).toHaveBeenCalledWith(
      'select ? as v',
      {
        named: 'ok',
      }
    );
    expect(rawObjectReturn.toString).toHaveBeenCalledOnce();
    expect(rawObjectReturn.toString).toHaveBeenCalledWith();
    expect(
      formatSqlWithBindings('select $2 as v', [9], 'postgres', knex)
    ).toBe('select $2 as v');
    expect(
      formatSqlWithBindings('select 1 as v', [10], 'sqlite3', knex)
    ).toBe('select 1 as v');
    expect(raw).not.toHaveBeenCalled();
  });

  it('throws for missing or unknown dialects', function () {
    const raw = vi.fn();
    expect(() =>
      formatSqlWithBindings('select 1', [1], null, { raw })
    ).toThrow('formatSqlWithBindings requires a dialect');

    expect(() =>
      formatSqlWithBindings('select 1', [1], 'unknown', { raw })
    ).toThrow('Unknown dialect for SQL bindings: unknown');
  });
});
