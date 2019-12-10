'use strict';

const { expect } = require('chai');
const {
  escapeObject,
  arrayToList,
  escapeString,
} = require('../../../lib/query/string');

describe('String utility functions', () => {
  describe('arrayToList', () => {
    const escapeFunc = (value) => value;
    const escapeQuotedFunc = (value) => `'${value}'`;

    it('should return empty string for an empty array', () => {
      const input = [];
      const output = '';

      expect(arrayToList(input, escapeFunc)).to.equal(output);
    });

    it('should return a string with empty parenthesis for a nested array with empty array', () => {
      const input = [[]];
      const output = '()';

      expect(arrayToList(input, escapeFunc)).to.equal(output);
    });

    it('should convert an array to a string', () => {
      const input = [1, 2, 3, 4, 5];
      const output1 = '1, 2, 3, 4, 5';
      const output2 = "'1', '2', '3', '4', '5'";

      expect(arrayToList(input, escapeFunc)).to.equal(output1);
      expect(arrayToList(input, escapeQuotedFunc)).to.equal(output2);
    });

    it('should convert a nested array to string', () => {
      const input = [0, [1, 2], [3, 4], 5];
      const output1 = '0, (1, 2), (3, 4), 5';
      const output2 = "'0', ('1', '2'), ('3', '4'), '5'";

      expect(arrayToList(input, escapeFunc)).to.equal(output1);
      expect(arrayToList(input, escapeQuotedFunc)).to.equal(output2);
    });

    it('should convert an array with single value to string', () => {
      const input = [0];
      const output = "'0'";

      expect(arrayToList(input, escapeQuotedFunc)).to.equal(output);
    });

    it('should convert a nested array with single value to string', () => {
      const input = [[0]];
      const output = "('0')";

      expect(arrayToList(input, escapeQuotedFunc)).to.equal(output);
    });

    it('should support an array with multiple levels of nesting', () => {
      const input = [0, [1, 2, [3, 4, [5, 6, [7]]]], 8];
      const output = '0, (1, 2, (3, 4, (5, 6, (7)))), 8';

      expect(arrayToList(input, escapeFunc)).to.equal(output);
    });
  });

  describe('escapeObject', () => {
    it('should use the `toSQL()` method on an object if it has it as a member', () => {
      const obj = {
        value: 'foo',
        toSQL(ctx) {
          return this.value + ctx;
        },
      };
      expect(escapeObject(obj, undefined, 'bar')).to.equal('foobar');
    });

    it('should give a stringified (json friendly) value if any scalar value is provided', () => {
      expect(escapeObject('foo')).to.equal('"foo"');
      expect(escapeObject('"foobar"')).to.equal('"\\"foobar\\""');
      expect(escapeObject("'foobar'")).to.equal(`"'foobar'"`);
      expect(escapeObject(0)).to.equal('0');
      expect(escapeObject(-5)).to.equal('-5');
      expect(escapeObject(null)).to.equal('null');
      expect(escapeObject(true)).to.equal('true');
      expect(escapeObject(false)).to.equal('false');
    });

    it('should return undefined if undefined is provided as an input', () => {
      expect(escapeObject(undefined)).to.equal(undefined);
    });
  });
});
