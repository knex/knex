'use strict';

const chai = require('chai');
const { escapeObject, arrayToList } = require('../../../lib/query/string');

describe('String utility functions', () => {
  describe('arrayToList', () => {
    const escapeFunc = (value) => value;
    const escapeQuotedFunc = (value) => `'${value}'`;

    it('should return empty string for an empty array', () => {
      const input = [];
      const output = '';

      expect(arrayToList(input, escapeFunc), output);
    });

    it('should return a string with empty parenthesis for a nested array with empty array', () => {
      const input = [[]];
      const output = '()';

      expect(arrayToList(input, escapeFunc), output);
    });

    it('should convert an array to a string', () => {
      const input = [1, 2, 3, 4, 5];
      const output1 = '1, 2, 3, 4, 5';
      const output2 = "'1', '2', '3', '4', '5'";

      expect(arrayToList(input, escapeFunc), output1);
      expect(arrayToList(input, escapeQuotedFunc), output2);
    });

    it('should convert a nested array to string', () => {
      const input = [0, [1, 2], [3, 4], 5];
      const output1 = '0, (1, 2), (3, 4), 5';
      const output2 = "'0', ('1', '2'), ('3', '4'), '5'";

      expect(arrayToList(input, escapeFunc), output1);
      expect(arrayToList(input, escapeQuotedFunc), output2);
    });

    it('should convert an array with single value to string', () => {
      const input = [0];
      const output = "'0'";

      expect(arrayToList(input, escapeQuotedFunc), output);
    });

    it('should convert a nested array with single value to string', () => {
      const input = [[0]];
      const output = "('0')";

      expect(arrayToList(input, escapeQuotedFunc), output);
    });

    it('should support an array with multiple levels of nesting', () => {
      const input = [0, [1, 2, [3, 4, [5, 6, [7]]]], 8];
      const output = '0, (1, 2, (3, 4, (5, 6, (7)))), 8';

      expect(arrayToList(input, escapeFunc), output);
    });
  });

  describe('escapeObject', () => {
    it("should use the `toSQL()` method on an object if it has it as it's member", () => {
      const obj = {
        value: 'foo',
        toSQL: (ctx) => {
          return this.value + ctx;
        },
      };
      expect(escapeObject(obj, 'bar'), 'foobar');
    });

    it('should give a stringified (json friendly) value if any scalar value is provided', () => {
      expect(escapeObject('foo'), '"foo"');
      expect(escapeObject('"foobar"'), '"\\"foobar\\""');
      expect(escapeObject("'foobar'"), `"'foobar'"`);
      expect(escapeObject(0), '0');
      expect(escapeObject(-5), '-5');
      expect(escapeObject(null), 'null');
      expect(escapeObject(true), 'true');
      expect(escapeObject(false), 'false');
    });

    it('should return undefined if undefined is provided as an input', () => {
      expect(escapeObject(undefined), undefined);
    });
  });
});
