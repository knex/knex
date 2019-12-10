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

  describe('escapeString', () => {
    it('should return a quoted string for a regular string', () => {
      expect(escapeString('Foo Bar')).to.equal("'Foo Bar'");
    });

    it('should return a quoted empty string for an empty string', () => {
      expect(escapeString('')).to.equal("''");
    });

    it('should escape a string with quotes', () => {
      expect(escapeString('foo = "bar"')).to.equal('\'foo = \\"bar\\"\'');
      expect(escapeString("foo = 'bar'")).to.equal("'foo = \\'bar\\''");
    });

    it('should escape a encoded json string', () => {
      const input = '{"foo": "bar"}';
      const output = '\'{\\"foo\\": \\"bar\\"}\'';

      expect(escapeString(input)).to.equal(output);
    });

    it('should escape strings with newline or other whitespace characters', () => {
      const input1 = `
      Foo Bar
      `;
      const output1 = "'\\n      Foo Bar\\n      '";
      const input2 =
        String.fromCharCode(13) +
        String.fromCharCode(10) +
        'Foo' +
        String.fromCharCode(9) +
        String.fromCharCode(9) +
        'Bar' +
        String.fromCharCode(13) +
        String.fromCharCode(10);
      const output2 = "'" + '\\r\\nFoo\\t\\tBar\\r\\n' + "'";

      expect(escapeString(input1)).to.equal(output1);
      expect(escapeString(input2)).to.equal(output2);
    });

    it('should quote the values well when used in SQL queries', () => {
      const user = 'foo';
      const password = "Test;$3`'[/*;";
      const sql =
        'SELECT * FROM users WHERE user = ' +
        escapeString(user) +
        ' AND password = ' +
        escapeString(password) +
        ';';
      const sqlOutput =
        "SELECT * FROM users WHERE user = 'foo' AND password = 'Test;$3`\\'[/*;';";

      expect(sql).to.equal(sqlOutput);
    });

    it('should quote the values subjective to SQL injection too when used in SQL queries', () => {
      const user = "' OR 0 = 0";
      const password = "' OR 1 = 1; DROP TABLE users; /*";
      const sql =
        'SELECT * FROM users WHERE user = ' +
        escapeString(user) +
        ' AND password = ' +
        escapeString(password) +
        ';';
      const sqlOutput =
        "SELECT * FROM users WHERE user = '\\' OR 0 = 0' AND password = '\\' OR 1 = 1; DROP TABLE users; /*';";

      expect(sql).to.equal(sqlOutput);
    });
  });
});
