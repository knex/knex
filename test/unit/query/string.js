'use strict';

const { expect } = require('chai');
const {
  escapeObject,
  arrayToList,
  escapeString,
  dateToString,
  makeEscape,
} = require('../../../lib/util/string');

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

  describe('dateToString', () => {
    it('should convert the given date to a string', () => {
      expect(dateToString(new Date(1995, 11, 17), undefined, {})).to.equal(
        '1995-12-17 00:00:00.000'
      );
      expect(
        dateToString(new Date(1995, 11, 17, 3, 24, 0), undefined, {})
      ).to.equal('1995-12-17 03:24:00.000');

      expect(
        dateToString(new Date('December 17, 1995 03:24:00'), undefined, {})
      ).to.equal('1995-12-17 03:24:00.000');

      expect(dateToString('1995-12-17 03:24:00.000', undefined, {})).to.equal(
        '1995-12-17 03:24:00.000'
      );
    });

    it('should work even when only the date argument is given', () => {
      expect(dateToString(new Date(1995, 11, 17))).to.equal(
        '1995-12-17 00:00:00.000'
      );
      expect(dateToString(new Date(1995, 11, 17, 3, 24, 0))).to.equal(
        '1995-12-17 03:24:00.000'
      );

      expect(dateToString(new Date('December 17, 1995 03:24:00'))).to.equal(
        '1995-12-17 03:24:00.000'
      );

      expect(dateToString('1995-12-17 03:24:00.000')).to.equal(
        '1995-12-17 03:24:00.000'
      );
    });

    it('should also convert timezone when given', () => {
      expect(
        dateToString(
          new Date('August 19, 1975 23:15:30 GMT+07:00'),
          undefined,
          {
            timeZone: 'GMT+07:00',
          }
        )
      ).to.equal('1975-08-19 23:15:30.000');

      expect(
        dateToString(new Date('August 19, 1975 GMT+00:00'), undefined, {
          timeZone: 'GMT+05:45',
        })
      ).to.equal('1975-08-19 05:45:00.000');

      expect(
        dateToString(
          new Date('August 19, 1975 05:45:00 GMT+05:45'),
          undefined,
          {
            timeZone: 'GMT+00:00',
          }
        )
      ).to.equal('1975-08-19 00:00:00.000');

      expect(
        dateToString(
          new Date('August 19, 1975 05:45:00 GMT+00:00'),
          undefined,
          {
            timeZone: 'Z',
          }
        )
      ).to.equal('1975-08-19 05:45:00.000');
    });
  });

  describe('makeEscape', () => {
    describe('when no config passed (default)', () => {
      const escapeFunc = makeEscape();

      it('should convert and escape boolean values to string', () => {
        expect(escapeFunc(true)).to.equal('true');
        expect(escapeFunc(false)).to.equal('false');
      });

      it('should convert and escape numeric values to string', () => {
        expect(escapeFunc(1234)).to.equal('1234');
        expect(escapeFunc(5678.9)).to.equal('5678.9');
        expect(escapeFunc(-4321.1234)).to.equal('-4321.1234');
      });

      it('should convert and escape an array to string', () => {
        expect(escapeFunc([1, 2, 3, 4])).to.equal('1, 2, 3, 4');
        expect(escapeFunc(['one', 'two', 'three', 'four'])).to.equal(
          "'one', 'two', 'three', 'four'"
        );
      });

      it('should convert and escape a date instance to string', () => {
        expect(escapeFunc(new Date('December 17, 1995 03:24:00'))).to.equal(
          "'1995-12-17 03:24:00.000'"
        );
      });

      it('should convert and escape an object to string', () => {
        expect(escapeFunc({ foo: 'bar', baz: [1, 2] })).to.equal(
          '{"foo":"bar","baz":[1,2]}'
        );

        expect(
          escapeFunc({ toSQL: () => 'SELECT 1 FROM test_table;' })
        ).to.equal('SELECT 1 FROM test_table;');
      });

      it('should convert and escape a buffer to string', () => {
        expect(escapeFunc(Buffer.from('Foo Bar'))).to.equal(
          "X'466f6f20426172'"
        );
      });

      it('should convert empty value to `NULL` string', () => {
        expect(escapeFunc(undefined)).to.equal('NULL');
        expect(escapeFunc(null)).to.equal('NULL');
      });
    });

    describe('when config passed', () => {
      const escapeFunc = makeEscape({
        escapeDate: (date) => new Date(date).toUTCString(),
        escapeArray: (arr) => arr.join(', '),
        escapeObject: (obj) => JSON.stringify(obj),
        escapeBuffer: (buf) => buf.toString('hex'),
      });

      it('should work with a custom date escape function', () => {
        expect(escapeFunc(new Date('14 Jun 2017 00:00:00 GMT'))).to.equal(
          "'Wed, 14 Jun 2017 00:00:00 GMT'"
        );
      });

      it('should work with a custom array escape function', () => {
        expect(escapeFunc([1, 2, 3, 4])).to.equal('1, 2, 3, 4');
      });

      it('should work with a custom object escape function', () => {
        expect(escapeFunc({ a: [1, 2, 3, 4] })).to.equal('{"a":[1,2,3,4]}');
      });

      it('should work with a custom buffer escape function', () => {
        expect(escapeFunc(Buffer.from('Foo Bar'))).to.equal('466f6f20426172');
      });

      it('should convert empty value to `NULL` string', () => {
        expect(escapeFunc(undefined)).to.equal('NULL');
        expect(escapeFunc(null)).to.equal('NULL');
      });

      it('should convert and escape boolean values to string', () => {
        expect(escapeFunc(true)).to.equal('true');
        expect(escapeFunc(false)).to.equal('false');
      });

      it('should convert and escape numeric values to string', () => {
        expect(escapeFunc(1234)).to.equal('1234');
        expect(escapeFunc(5678.9)).to.equal('5678.9');
        expect(escapeFunc(-4321.1234)).to.equal('-4321.1234');
      });
    });
  });
});
