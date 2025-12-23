// @ts-check
'use strict';

const { inspect } = require('util');

const chai = require('chai');
chai.use(/** @type {any} */ (require('chai-as-promised')));
const { expect } = chai;

const {
  Cast,
  createCastFunction,
  castsTo,
  ResultMapper,
  safeGet,
  safeSet,
} = require('../../../lib/query/cast.js');
const { clone } = require('lodash');

describe('built-in casts', () => {
  /** @typedef {{ok: true, value: any, expected: any}} CastTestOk */
  /** @typedef {{ok: false, value: any, throws: RegExp}} CastTestFail */
  /** @typedef {CastTestOk|CastTestFail} CastTest */

  /** @type {CastTest[]} */
  const numberTests = [
    // negative zeroes
    { ok: true, value: -0, expected: -0 },
    { ok: true, value: '-0', expected: -0 },

    //  falsy values
    { ok: true, value: 0, expected: 0 },
    { ok: true, value: 0n, expected: 0 },

    // various castables
    { ok: true, value: '0', expected: 0 },
    { ok: true, value: 1, expected: 1 },
    { ok: true, value: -1, expected: -1 },
    { ok: true, value: 1n, expected: 1 },
    { ok: true, value: -1n, expected: -1 },
    {
      ok: true,
      value: Number.MAX_SAFE_INTEGER,
      expected: Number.MAX_SAFE_INTEGER,
    },
    {
      ok: true,
      value: Number.MIN_SAFE_INTEGER,
      expected: Number.MIN_SAFE_INTEGER,
    },
    {
      ok: true,
      value: BigInt(Number.MAX_SAFE_INTEGER),
      expected: Number.MAX_SAFE_INTEGER,
    },
    {
      ok: true,
      value: BigInt(Number.MIN_SAFE_INTEGER),
      expected: Number.MIN_SAFE_INTEGER,
    },

    // number-able, but invalid
    {
      ok: false,
      value: BigInt(Number.MAX_SAFE_INTEGER + 1),
      throws: /out of safe integer range/,
    },
    {
      ok: false,
      value: BigInt(Number.MIN_SAFE_INTEGER - 1),
      throws: /out of safe integer range/,
    },
    { ok: false, value: '', throws: /empty string/ },
    { ok: false, value: 'NaN', throws: /NaN/ },
    { ok: false, value: 'Infinity', throws: /infinity/ },

    // various non-castables
    { ok: false, value: undefined, throws: /undefined/ },
    { ok: false, value: null, throws: /null/ },
    { ok: false, value: {}, throws: /object/ },
    { ok: false, value: Object.create(null), throws: /object/ },
    { ok: false, value: new Date(), throws: /Date/ },
  ];

  /** @type {CastTest[]} */
  const bigintTests = [
    //  falsy values
    { ok: true, value: 0, expected: 0n },
    { ok: true, value: -0, expected: 0n },
    { ok: true, value: 0n, expected: 0n },

    // various castables
    { ok: true, value: '0', expected: 0n },
    { ok: true, value: 1, expected: 1n },
    { ok: true, value: -1, expected: -1n },
    { ok: true, value: 1n, expected: 1n },
    { ok: true, value: -1n, expected: -1n },
    {
      ok: true,
      value: Number.MAX_SAFE_INTEGER,
      expected: BigInt(Number.MAX_SAFE_INTEGER),
    },
    {
      ok: true,
      value: Number.MIN_SAFE_INTEGER,
      expected: BigInt(Number.MIN_SAFE_INTEGER),
    },
    {
      ok: true,
      value: BigInt(Number.MAX_SAFE_INTEGER),
      expected: BigInt(Number.MAX_SAFE_INTEGER),
    },
    {
      ok: true,
      value: BigInt(Number.MIN_SAFE_INTEGER),
      expected: BigInt(Number.MIN_SAFE_INTEGER),
    },
    {
      ok: true,
      value: BigInt(Number.MAX_SAFE_INTEGER + 1),
      expected: BigInt(Number.MAX_SAFE_INTEGER + 1),
    },
    {
      ok: true,
      value: BigInt(Number.MIN_SAFE_INTEGER - 1),
      expected: BigInt(Number.MIN_SAFE_INTEGER - 1),
    },

    // number-able, but invalid
    { ok: false, value: '', throws: /empty string/ },
    { ok: false, value: Infinity, throws: /not an integer/ },
    { ok: false, value: -Infinity, throws: /not an integer/ },
    { ok: false, value: NaN, throws: /not an integer/ },
    { ok: false, value: 1.2, throws: /not an integer/ },
    { ok: false, value: -1.2, throws: /not an integer/ },

    // various non-castables
    { ok: false, value: undefined, throws: /undefined/ },
    { ok: false, value: null, throws: /null/ },
    { ok: false, value: {}, throws: /object/ },
    { ok: false, value: Object.create(null), throws: /object/ },
    { ok: false, value: new Date(), throws: /Date/ },
  ];

  /** @type {Record<keyof typeof Cast, CastTest[]>} */
  const defaultCastTests = { number: numberTests, bigint: bigintTests };

  for (const [type, tests] of Object.entries(defaultCastTests)) {
    for (const test of tests) {
      if (test.ok) {
        it(`Casts ${inspect(test.value)} to ${type}`, () => {
          const actual = Cast[/** @type {keyof typeof Cast} */ (type)](
            test.value
          );
          expect(actual).to.equal(test.expected);
        });
      } else {
        it(`Throws when casting ${inspect(test.value)} to ${type}`, () => {
          expect(() => {
            Cast[/** @type {keyof typeof Cast} */ (type)](test.value);
          }).to.throw(test.throws);
        });
      }
    }
  }
});

describe('castsTo', () => {
  const fn = createCastFunction('foo', () => {});
  const tests = [
    { name: 'custom function', cast: fn, ok: 'foo', fail: 'bar' },
    { name: 'built-in string', cast: 'bigint', ok: 'bigint', fail: 'number' },
    { name: 'built-in string', cast: 'unknown', fail: 'number' },
    { name: 'built-in string', cast: null, fail: 'number' },
  ];

  for (const { name, cast, ok, fail } of tests) {
    if (ok) {
      it(`${name} with ${ok} = true`, () => {
        expect(castsTo(/** @type {any} */ (cast), ok)).to.equal(true);
      });
    }
    if (fail) {
      it(`${name} with ${fail} = false`, () => {
        expect(castsTo(/** @type {any} */ (cast), fail)).to.equal(false);
      });
    }
  }
});

describe('ResultMapper', () => {
  /**
   * @param {ResultMapper} rm
   * @param {any} result
   * @param {any} [ctx]
   * @returns
   */
  const applyTo = (rm, result, ctx = undefined) => {
    const cloned = clone(result);
    rm.applyTo(cloned, ctx);
    return cloned;
  };

  it('skips nullish and empty arrays', () => {
    const rm = new ResultMapper({});
    expect(applyTo(rm, undefined, undefined)).to.be.undefined;
    expect(applyTo(rm, null, undefined)).to.be.null;
    expect(applyTo(rm, [], undefined)).to.eql([]);
  });

  describe('spec validation', () => {
    it('fails on invalid built-ins in the spec', () => {
      expect(() => {
        new ResultMapper(/** @type {any} */ ({ foo: 'oh noes' }));
      }).to.throw(/Invalid.*oh noes/);
    });

    it('fails on untagged functions', () => {
      expect(() => {
        new ResultMapper(/** @type {any} */ ({ foo: () => {} }));
      }).to.throw(/Invalid.*createCastFunction/);
    });

    it('fails on unknown values', () => {
      expect(() => {
        new ResultMapper(/** @type {any} */ ({ foo: new Date() }));
      }).to.throw(/Invalid.*Date/);
    });
  });

  describe('safeGet', () => {
    it('returns undefined for __proto__', () => {
      expect(safeGet({}, '__proto__')).to.be.undefined;
    });
  });
  describe('safeSet', () => {
    it('assigns __proto__ as an own property', () => {
      const obj = {};
      safeSet(obj, '__proto__', 'foo');
      expect(Object.getPrototypeOf(obj)).to.equal(Object.prototype);
      // one could argue that it's risky to even produce such objects, but
      // the take here is that we're being "transparent" to whatever the user
      // is doing. it's up to the user to protect themselves, we just want to
      // avoid vulnerabilities in _our_ code
      expect(JSON.stringify(obj)).to.equal(`{"__proto__":"foo"}`);
    });
  });

  describe('no spec, no callback', () => {
    it('has no effect', () => {
      const rm = new ResultMapper({});
      const row = {
        a: 1,
        b: 1n,
        c: 'string',
      };

      expect(applyTo(rm, row)).to.deep.equal(row);
    });
  });

  describe('spec, no callback', () => {
    it('utilizes safe get/set', () => {
      const obj = JSON.parse(`{"__proto__":1}`);
      const rm = new ResultMapper({ ['__proto__']: 'number' });
      expect(JSON.stringify(applyTo(rm, obj))).to.equal(JSON.stringify(obj));
    });

    it('maps the specified columns', () => {
      const rm = new ResultMapper({
        a: 'bigint',
        b: 'number',
        c: createCastFunction('foo', (v) => `${v}foo`),
      });
      const row = {
        a: 1,
        b: 1n,
        c: 'string',
        d: 1,
        e: 1n,
      };
      const expected = {
        a: 1n,
        b: 1,
        c: 'stringfoo',
        d: 1,
        e: 1n,
      };

      // single row
      expect(applyTo(rm, row)).to.deep.equal(expected);

      // multiple rows
      expect(applyTo(rm, [row])).to.deep.equal([expected]);
    });

    it('does not map nullish values', () => {
      const rm = new ResultMapper({
        a: 'bigint',
        b: 'number',
      });

      const rows = [{ a: 1, b: null }, { b: 1n }];

      expect(applyTo(rm, rows)).to.deep.equal([{ a: 1n, b: null }, { b: 1 }]);
    });
  });

  describe('spec, callback', () => {
    it('utilizes safe get/set', () => {
      const obj = JSON.parse(`{"__proto__":1}`);
      const rm = new ResultMapper({ ['__proto__']: 'number' }, () => 'mapped');
      expect(JSON.stringify(applyTo(rm, obj))).to.equal(
        `{"__proto__":"mapped"}`
      );
    });

    it('maps via the callback', () => {
      const rm = new ResultMapper(
        {
          a: 'bigint',
          b: 'number',
          c: createCastFunction('foo', (v) => `${v}foo`),
        },
        () => 'mapped'
      );
      const row = {
        a: 1,
        b: 1n,
        c: 'string',
        d: 1,
        e: 1n,
      };
      const expected = {
        a: 'mapped',
        b: 'mapped',
        c: 'mapped',
        d: 'mapped',
        e: 'mapped',
      };

      // single row
      expect(applyTo(rm, row)).to.deep.equal(expected);

      // multiple rows
      expect(applyTo(rm, [row])).to.deep.equal([expected]);
    });

    it('provides the callback with the default cast function', () => {
      const rm = new ResultMapper(
        {
          a: 'bigint',
          b: 'number',
          c: createCastFunction('foo', (v) => `${v}foo`),
        },
        (value, cast) => cast(value)
      );
      const row = {
        a: 1,
        b: 1n,
        c: 'string',
        d: 1,
        e: 1n,
      };
      const expected = {
        a: 1n,
        b: 1,
        c: 'stringfoo',
        d: 1,
        e: 1n,
      };

      // single row
      expect(applyTo(rm, row)).to.deep.equal(expected);

      // multiple rows
      expect(applyTo(rm, [row])).to.deep.equal([expected]);
    });

    it('provides the callback with the context value', () => {
      const rm = new ResultMapper(
        {
          a: 'bigint',
          b: 'number',
          c: createCastFunction('foo', (v) => `${v}foo`),
        },
        (value, cast, ctx) => ctx
      );
      const row = {
        a: 1,
        b: 1n,
        c: 'string',
        d: 1,
        e: 1n,
      };
      const expected = {
        a: 'ctx',
        b: 'ctx',
        c: 'ctx',
        d: 'ctx',
        e: 'ctx',
      };

      // single row
      expect(applyTo(rm, row, 'ctx')).to.deep.equal(expected);

      // multiple rows
      expect(applyTo(rm, [row], 'ctx')).to.deep.equal([expected]);
    });

    it('does not map nullish values', () => {
      const rm = new ResultMapper(
        {
          a: 'bigint',
          b: 'number',
        },
        () => 'mapped'
      );

      const rows = [{ a: 1, b: null }, { b: 1n }];

      expect(applyTo(rm, rows)).to.deep.equal([
        { a: 'mapped', b: null },
        { b: 'mapped' },
      ]);
    });
  });
});
