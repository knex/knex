const {
  isNonNegInt,
  isVersion,
  parseVersion,
  parseVersionOrError,
  compareVersions,
  satisfiesVersion,
} = require('../../../lib/util/version');
const { expect } = require('chai');

describe('utils/version', () => {
  describe('isNonNegInt', () => {
    const scenarioMatrix = [
      { input: 0, result: true },
      { input: 1, result: true },
      { input: Number.MAX_SAFE_INTEGER, result: true },
      { input: -1, result: false },
      { input: 1.5, result: false },
      { input: -Number.MAX_SAFE_INTEGER, result: false },
      { input: -Number.MIN_VALUE, result: false },
    ];

    scenarioMatrix.forEach(({ input, result }) => {
      it(`returns ${result} for ${input}`, () => {
        expect(isNonNegInt(input)).to.equal(result);
      });
    });
  });

  describe('isVersion', () => {
    const scenarioMatrix = [
      { input: [0, 0, 0], result: true },
      { input: [3, 2, 1], result: true },
      {
        input: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        result: true,
      },
      // Non-arrays
      { input: undefined, result: false },
      { input: null, result: false },
      { input: {}, result: false },
      { input: 'a', result: false },
      { input: true, result: false },
      // Non-three element arrays
      { input: [], result: false },
      { input: [0], result: false },
      { input: [0, 0], result: false },
      { input: [0, 0, 0, 0], result: false },
      // Three element arrays with non-numbers
      { input: [null, 0, 0], result: false },
      { input: [0, 0, null], result: false },
      { input: [undefined, 0, 0], result: false },
      { input: [0, 0, undefined], result: false },
      { input: [{}, 0, 0], result: false },
      { input: [0, 0, {}], result: false },
      { input: ['a', 0, 0], result: false },
      { input: [0, 0, 'a'], result: false },
      { input: [true, 0, 0], result: false },
      { input: [0, 0, true], result: false },
      // Three element arrays with invalid numbers
      { input: [-1, 0, 0], result: false },
      { input: [0, 0, -1], result: false },
      { input: [1.5, 0, 0], result: false },
      { input: [0, 0, 1.5], result: false },
      { input: [-Number.MAX_SAFE_INTEGER, 0, 0], result: false },
      { input: [0, 0, -Number.MAX_SAFE_INTEGER], result: false },
      { input: [-Number.MIN_VALUE, 0, 0], result: false },
      { input: [0, 0, -Number.MIN_VALUE], result: false },
    ];

    scenarioMatrix.forEach(({ input, result }) => {
      it(`returns ${result} for ${JSON.stringify(input)}`, () => {
        expect(isVersion(input)).to.equal(result);
      });
    });
  });

  const parseVersionScenarioMatrix = [
    { input: '0.0.0', result: [0, 0, 0] },
    { input: '3.2.1', result: [3, 2, 1] },
    {
      input: `${Number.MAX_SAFE_INTEGER}.${Number.MAX_SAFE_INTEGER}.${Number.MAX_SAFE_INTEGER}`,
      result: [
        Number.MAX_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER,
      ],
    },
    { input: '3.2.1.0', result: [3, 2, 1] },
    { input: '3.2.1a', result: [3, 2, 1] },
    { input: '3.2.1-a', result: [3, 2, 1] },
    // Not three digits
    { input: '', result: undefined },
    { input: 'a', result: undefined },
    { input: 'a.0.0', result: undefined },
    { input: '0.0.a', result: undefined },
    { input: 'a.0.0.0', result: undefined },
    { input: '0.0.a.0', result: undefined },
    // Three element arrays with invalid numbers
    { input: '-1.0.0', result: undefined },
    { input: '0.0.-1', result: undefined },
  ];

  describe('parseVersion', () => {
    parseVersionScenarioMatrix.forEach(({ input, result }) => {
      it(`returns ${JSON.stringify(result)} for '${input}'`, () => {
        expect(parseVersion(input)).to.deep.equal(result);
      });
    });
  });

  describe('parseVersionOrError', () => {
    parseVersionScenarioMatrix.forEach(({ input, result }) => {
      const doesThrow = result === undefined;
      const testText = doesThrow
        ? 'throws error'
        : `returns ${JSON.stringify(result)}`;
      it(`${testText} for '${input}'`, () => {
        if (doesThrow) {
          expect(() => parseVersionOrError(input)).to.throw();
        } else {
          expect(parseVersionOrError(input)).to.deep.equal(result);
        }
      });
    });
  });

  describe('compareVersions', () => {
    const scenarioMatrix = [
      // Equality
      { v1: [0, 0, 0], v2: [0, 0, 0], result: 0 },
      { v1: [3, 2, 1], v2: [3, 2, 1], result: 0 },
      {
        v1: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        v2: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        result: 0,
      },
      // Major version difference
      { v1: [4, 0, 0], v2: [3, 2, 1], result: 1 },
      { v1: [3, 2, 1], v2: [4, 0, 0], result: -1 },
      // Minor version difference
      { v1: [3, 3, 0], v2: [3, 2, 1], result: 1 },
      { v1: [3, 2, 1], v2: [3, 3, 0], result: -1 },
      // Patch version difference
      { v1: [3, 2, 2], v2: [3, 2, 1], result: 1 },
      { v1: [3, 2, 1], v2: [3, 2, 2], result: -1 },
    ];

    scenarioMatrix.forEach(({ v1, v2, result }) => {
      it(`returns ${result} for ${JSON.stringify({ v1, v2 })}`, () => {
        expect(compareVersions(v1, v2)).to.equal(result);
      });
    });
  });

  describe('satisfiesVersion', () => {
    const scenarioMatrix = [
      // Invalid inputs
      { version: null, min: [3, 2, 1], max: [3, 2, 1], throws: true },
      { version: 'a', min: [3, 2, 1], max: [3, 2, 1], throws: true },
      { version: 1, min: [3, 2, 1], max: [3, 2, 1], throws: true },
      { version: {}, min: [3, 2, 1], max: [3, 2, 1], throws: true },
      { version: [], min: [3, 2, 1], max: [3, 2, 1], throws: true },
      { version: [1], min: [3, 2, 1], max: [3, 2, 1], throws: true },
      { version: [1, 2], min: [3, 2, 1], max: [3, 2, 1], throws: true },
      { version: [1, 2, 3, 4], min: [3, 2, 1], max: [3, 2, 1], throws: true },

      // Neither min nor max
      { version: [0, 0, 0], min: undefined, max: undefined, throws: true },

      // Min only
      //  Equal to min
      { version: [0, 0, 0], min: [0, 0, 0], max: undefined, result: true },
      { version: [3, 2, 1], min: [3, 2, 1], max: undefined, result: true },
      {
        version: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        min: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        max: undefined,
        result: true,
      },
      //  Exceeds min, major
      { version: [4, 0, 0], min: [3, 2, 1], max: undefined, result: true },
      {
        version: [Number.MAX_SAFE_INTEGER, 0, 0],
        min: [3, 2, 1],
        max: undefined,
        result: true,
      },
      //  Exceeds min, minor
      { version: [3, 3, 0], min: [3, 2, 1], max: undefined, result: true },
      {
        version: [3, Number.MAX_SAFE_INTEGER, 0],
        min: [3, 2, 1],
        max: undefined,
        result: true,
      },
      //  Exceeds min, patch
      { version: [3, 2, 2], min: [3, 2, 1], max: undefined, result: true },
      {
        version: [3, 2, Number.MAX_SAFE_INTEGER],
        min: [3, 2, 1],
        max: undefined,
        result: true,
      },
      //  Below min, major
      { version: [2, 2, 1], min: [3, 2, 1], max: undefined, result: false },
      {
        version: [2, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
        min: [3, 2, 1],
        max: undefined,
        result: false,
      },
      //  Below min, minor
      { version: [3, 1, 1], min: [3, 2, 1], max: undefined, result: false },
      {
        version: [3, 1, Number.MAX_SAFE_INTEGER],
        min: [3, 2, 1],
        max: undefined,
        result: false,
      },
      //  Below min, patch
      { version: [3, 2, 0], min: [3, 2, 1], max: undefined, result: false },

      // Max only
      //  Equal to max
      { version: [0, 0, 0], min: undefined, max: [0, 0, 0], result: false },
      { version: [3, 2, 1], min: undefined, max: [3, 2, 1], result: false },
      {
        version: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        min: undefined,
        max: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        result: false,
      },
      //  Exceeds max, major
      { version: [4, 0, 0], min: undefined, max: [3, 2, 1], result: false },
      {
        version: [Number.MAX_SAFE_INTEGER, 0, 0],
        min: undefined,
        max: [3, 2, 1],
        result: false,
      },
      //  Exceeds max, minor
      { version: [3, 3, 0], min: undefined, max: [3, 2, 1], result: false },
      {
        version: [3, Number.MAX_SAFE_INTEGER, 0],
        min: undefined,
        max: [3, 2, 1],
        result: false,
      },
      //  Exceeds max, patch
      { version: [3, 2, 2], min: undefined, max: [3, 2, 1], result: false },
      {
        version: [3, 2, Number.MAX_SAFE_INTEGER],
        min: undefined,
        max: [3, 2, 1],
        result: false,
      },
      //  Below max, major
      { version: [2, 2, 1], min: undefined, max: [3, 2, 1], result: true },
      {
        version: [2, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
        min: undefined,
        max: [3, 2, 1],
        result: true,
      },
      //  Below max, minor
      { version: [3, 1, 1], min: undefined, max: [3, 2, 1], result: true },
      {
        version: [3, 1, Number.MAX_SAFE_INTEGER],
        min: undefined,
        max: [3, 2, 1],
        result: true,
      },
      //  Below max, patch
      { version: [3, 2, 0], min: undefined, max: [3, 2, 1], result: true },

      // Min and max
      //  Equal to min and max
      { version: [0, 0, 0], min: [0, 0, 0], max: [0, 0, 0], result: false },
      { version: [3, 2, 1], min: [3, 2, 1], max: [3, 2, 1], result: false },
      {
        version: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        min: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        max: [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ],
        result: false,
      },
      //  Equal to min and below max
      { version: [3, 2, 1], min: [3, 2, 1], max: [4, 0, 0], result: true },
      { version: [3, 2, 1], min: [3, 2, 1], max: [3, 3, 0], result: true },
      { version: [3, 2, 1], min: [3, 2, 1], max: [3, 2, 2], result: true },
      //  Equal to min and above max
      { version: [3, 2, 1], min: [3, 2, 1], max: [2, 9, 9], result: false },
      { version: [3, 2, 1], min: [3, 2, 1], max: [3, 1, 9], result: false },
      { version: [3, 2, 1], min: [3, 2, 1], max: [3, 2, 0], result: false },
      //  Above min and equal to max
      { version: [3, 2, 1], min: [2, 9, 9], max: [3, 2, 1], result: false },
      { version: [3, 2, 1], min: [3, 1, 9], max: [3, 2, 1], result: false },
      { version: [3, 2, 1], min: [3, 2, 0], max: [3, 2, 1], result: false },
      //  Above min and below max
      { version: [3, 2, 1], min: [2, 9, 9], max: [4, 0, 0], result: true },
      { version: [3, 2, 1], min: [3, 1, 9], max: [3, 3, 0], result: true },
      { version: [3, 2, 1], min: [3, 2, 0], max: [3, 2, 2], result: true },
      //  Above min and above max
      { version: [3, 2, 1], min: [2, 9, 9], max: [2, 9, 9], result: false },
      { version: [3, 2, 1], min: [3, 1, 9], max: [3, 1, 9], result: false },
      { version: [3, 2, 1], min: [3, 2, 0], max: [3, 2, 0], result: false },
      //  Below min and equal to max
      { version: [3, 2, 1], min: [4, 0, 0], max: [3, 2, 1], result: false },
      { version: [3, 2, 1], min: [3, 3, 0], max: [3, 2, 1], result: false },
      { version: [3, 2, 1], min: [3, 2, 2], max: [3, 2, 1], result: false },
      //  Below min and below max
      { version: [3, 2, 1], min: [4, 0, 0], max: [4, 0, 0], result: false },
      { version: [3, 2, 1], min: [3, 3, 0], max: [3, 3, 0], result: false },
      { version: [3, 2, 1], min: [3, 2, 2], max: [3, 2, 2], result: false },
      //  Below min and above max
      { version: [3, 2, 1], min: [4, 0, 0], max: [2, 9, 9], result: false },
      { version: [3, 2, 1], min: [3, 3, 0], max: [3, 1, 9], result: false },
      { version: [3, 2, 1], min: [3, 2, 2], max: [3, 2, 0], result: false },
    ];

    scenarioMatrix.forEach(({ version, min, max, result, throws }) => {
      const testText = throws ? 'throws error' : `returns ${result}`;
      it(`${testText} for '${JSON.stringify({ version, min, max })}'`, () => {
        if (throws) {
          expect(() => satisfiesVersion(version, min, max)).to.throw();
        } else {
          expect(satisfiesVersion(version, min, max)).to.equal(result);
        }
      });
    });
  });
});
