const { expect } = require('chai');

const Formatter = require('../../../lib/formatter');
const Client = require('../../../lib/client');
const { getAllClients } = require('../util/clients');

/** @typedef {import('../util/clients').DialectName} DialectName */
/** @typedef {import('../util/clients').ClientCtor} ClientCtor */
/** @type {Record<DialectName, {left: string, right: string, qleft?: string, qright?: string}>} */
const quoteChars = {
  mysql: { left: '`', right: '`' },
  oracle: { left: `"`, right: `"` },
  postgresql: { left: `"`, right: `"` },
  redshift: { left: `"`, right: `"` },
  sqlite3: { left: '`', right: '`' },
  // because mssql has assymetric identifier quoting characters, only
  // the right bracket needs to be doubled to escape it. for whatever
  // reason, the code currently _removes_ quote characters instead of
  // escaping them
  mssql: { left: `[`, right: `]`, qleft: '', qright: '' },
};

const queryContext = () => {
  return {};
};

const client = new Client({ client: 'generic' });
const formatter = () => new Formatter(client, { queryContext });

/** @typedef {{formatter: () => Formatter, driverName: string, left: string, right: string, qleft: string, qright: string}} ClientFormatter */

/**
 * @param {ClientCtor} ctor
 * @param {string} dialect
 * @param {string} driverName
 * @returns {ClientFormatter}
 */
const formatterFactory = (Ctor, dialect, driverName) => {
  const { left, right, ...rest } = quoteChars[dialect];
  const qleft = rest.qleft ?? `${left}${left}`;
  const qright = rest.qright ?? `${right}${right}`;

  const client = new Ctor({ client: driverName });
  const formatter = () => new Formatter(client, { queryContext });
  return { formatter, driverName, left, right, qleft, qright };
};

/**
 * @returns {Generator<ClientFormatter>}
 */
const forAllClients = () => getAllClients(formatterFactory);

describe('formatter', () => {
  // columnize just calls wrap for multiple values, joining
  // them with a comma
  describe('columnize', () => {
    it('correctly handles single column value', () => {
      const columns = formatter().columnize('columnName');
      expect(columns).to.equal('"columnName"');
    });

    it('correctly handles multiple column values', () => {
      const columns = formatter().columnize(['columnName1', 'columnName2']);
      expect(columns).to.equal('"columnName1", "columnName2"');
    });

    it('correctly handles null', () => {
      const columns = formatter().columnize(null);
      expect(columns).to.equal('');
    });

    it('correctly handles empty array', () => {
      const columns = formatter().columnize([]);
      expect(columns).to.equal('');
    });
  });

  // wrap does all the heavy lifting
  describe('wrap', () => {
    it('wraps an identifier as a string', () => {
      for (const isParameter of [undefined, true, false]) {
        const value = formatter().wrap('foo', isParameter);
        expect(value).to.equal('"foo"');
      }
    });

    for (const { driverName, formatter, ...rest } of forAllClients()) {
      it(`escapes identifier values (driver=${driverName})`, () => {
        const { left: l, right: r, qleft: ql, qright: qr } = rest;

        const table = [
          { value: `f${l}oo`, expected: `${l}f${ql}oo${r}` },
          { value: `f${r}oo`, expected: `${l}f${qr}oo${r}` },
          { value: `f${l}${r}oo`, expected: `${l}f${ql}${qr}oo${r}` },
        ];

        for (const isParameter of [undefined, true, false]) {
          for (const { value, expected } of table) {
            const result = formatter().wrap(value, isParameter);
            expect(result).to.equal(expected);
          }
        }
      });
    }

    it('extracts column aliases from a string', () => {
      const table = [
        { value: 'foo as bar', expected: '"foo" as "bar"' },
        { value: 'foo aS bar', expected: '"foo" as "bar"' },
        { value: 'foo   as bar', expected: '"foo" as "bar"' },
        { value: 'foo as   bar', expected: '"foo" as "bar"' },

        { value: 'foo as bar as baz', expected: '"foo" as "bar as baz"' },
      ];
      for (const isParameter of [undefined, true, false]) {
        for (const { value, expected } of table) {
          const result = formatter().wrap(value, isParameter);
          expect(result).to.equal(expected);
        }
      }
    });
    it('wraps qualified segments separately', () => {
      const table = [
        { value: 'foo.bar', expected: '"foo"."bar"' },
        { value: 'foo.bar as baz', expected: '"foo"."bar" as "baz"' },
        // this should probably throw an error, but it's how the code currently works
        { value: '.bar', expected: '""."bar"' },
      ];
      for (const isParameter of [undefined, true, false]) {
        for (const { value, expected } of table) {
          const result = formatter().wrap(value, isParameter);
          expect(result).to.equal(expected);
        }
      }
    });
    it('uses a number as-is', () => {
      for (const isParameter of [undefined, true, false]) {
        const value = formatter().wrap(123, isParameter);
        expect(value).to.equal(123);
      }
    });
    it('returns Raw values as-is', () => {
      for (const isParameter of [undefined, true, false]) {
        const value = formatter().wrap(client.raw('foo'), isParameter);
        expect(value).to.equal('foo');
      }
    });
    it('pushes bindings from Raw values', () => {
      const inst = formatter();
      for (const isParameter of [undefined, true, false]) {
        const value = inst.wrap(
          client.raw('? ??', ['foo', 'bar']),
          isParameter
        );
        expect(value).to.equal('? "bar"');
      }

      // each call to wrap pushes onto the formatter's bindings array,
      // so the number of instances of "foo" (which is a bound parameter)
      // equals the number of elements in the isParameter loop.
      // "bar" is an identifier placeholder so it gets inserted directly
      expect(inst.bindings).to.deep.eq(['foo', 'foo', 'foo']);
    });

    it('wraps a callback result', () => {
      // the second argument (isParameter) to wrap seems intended to force
      // () around the result, but for the callback form it seems to be
      // done whether or not that argument is specified
      for (const isParameter of [undefined, true, false]) {
        const value = formatter().wrap(
          (builder) => builder.select('foo'),
          isParameter
        );
        expect(value).to.equal('(select "foo")');
      }
    });
    // callbacks receive a query builder to extend and get surrounded in ()
    it('wraps a callback result with an alias', () => {
      // the second argument (isParameter) to wrap seems intended to force
      // () around the result, but for the callback form it seems to be
      // done whether or not that argument is specified
      for (const isParameter of [undefined, true, false]) {
        const value = formatter().wrap(
          (builder) => builder.select('foo').as('bar'),
          isParameter
        );
        expect(value).to.equal('(select "foo") as "bar"');
      }
    });

    it('wraps a QueryBuilder (isParameter=false, undefined)', () => {
      for (const isParameter of [undefined, false]) {
        const builder = client.queryBuilder();
        const value = formatter().wrap(builder.select('foo'), isParameter);
        expect(value).to.equal('select "foo"');
      }
    });
    it('wraps a QueryBuilder (isParameter=true)', () => {
      // this seems to be the only case where isParameter has an effect?
      for (const isParameter of [true]) {
        const builder = client.queryBuilder();
        const value = formatter().wrap(builder.select('foo'), isParameter);
        expect(value).to.equal('(select "foo")');
      }
    });

    it('wraps a QueryBuilder with an alias', () => {
      for (const isParameter of [undefined, true, false]) {
        const builder = client.queryBuilder();
        const value = formatter().wrap(
          builder.select('foo').as('bar'),
          isParameter
        );
        expect(value).to.equal('(select "foo") as "bar"');
      }
    });

    it('wraps a column-alias object', () => {
      for (const isParameter of [undefined, true, false]) {
        const value = formatter().wrap(
          { foo: 'bar', baz: 'quux' },
          isParameter
        );
        expect(value).to.equal('"bar" as "foo", "quux" as "baz"');
      }
    });

    it('wraps a column-alias object with query values', () => {
      const qb = () => client.queryBuilder();
      for (const isParameter of [undefined, true, false]) {
        const value = formatter().wrap(
          {
            foo: qb().from('bar'),
            // in the raw query-builder-value form, knex double-aliases the query
            baz: qb().from('quux').as('corge'),
          },
          isParameter
        );
        expect(value).to.equal(
          '(select * from "bar") as "foo", ((select * from "quux") as "corge") as "baz"'
        );
      }
    });

    it('wraps a column-alias object with callbacks', () => {
      for (const isParameter of [undefined, true, false]) {
        const value = formatter().wrap(
          {
            foo: (qb) => qb.from('bar'),
            // in the callback form, knex avoids double-aliasing the query and keeps
            // the alias from the object key
            baz: (qb) => qb.from('quux').as('corge'),
          },
          isParameter
        );
        expect(value).to.equal(
          '(select * from "bar") as "foo", (select * from "quux") as "baz"'
        );
      }
    });
  });

  // these tests are less complete than 'wrap' because they just farm out
  // to wrap anyway, depending on the passed-in value (function, QueryBuilder,
  // or anything else)
  describe('wrapForExpressionList', () => {
    it('wraps an identifier as a string', () => {
      const value = formatter().wrapForExpressionList('foo');
      expect(value).to.equal('"foo"');
    });

    it("always wraps a QueryBuilder's output in parenthesis", () => {
      for (const isParameter of [true, false, undefined]) {
        const builder = client.queryBuilder();
        const value = formatter().wrapForExpressionList(
          builder.select('foo'),
          isParameter
        );
        expect(value).to.equal('(select "foo")');
      }
    });

    it("always wraps a callback's output in parenthesis", () => {
      for (const isParameter of [true, false, undefined]) {
        const value = formatter().wrapForExpressionList(
          (builder) => builder.select('foo'),
          isParameter
        );
        expect(value).to.equal('(select "foo")');
      }
    });

    it('does not push to bindings when isParameter is falsy', () => {
      for (const isParameter of [undefined, false]) {
        const inst = formatter();
        inst.wrapForExpressionList('foo', isParameter);
        expect(inst.bindings).to.deep.eq([]);
      }
    });

    it('pushes plain values to bindings when isParameter is true', () => {
      for (const val of [123, 'foo']) {
        const inst = formatter();
        // this is a mostly-nonsensical syntax, but we are just checking
        // that it gets passed through correctly
        inst.wrapForExpressionList(val, true);
        expect(inst.bindings).to.deep.eq([val]);
      }
    });
  });
});
