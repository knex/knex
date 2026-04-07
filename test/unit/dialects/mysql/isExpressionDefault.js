const { expect } = require('chai');
const isExpressionDefault = require('../../../../lib/dialects/mysql/schema/internal/isExpressionDefault');

describe('MySQL isExpressionDefault', function () {
  describe('temporal functions', function () {
    it('detects CURRENT_TIMESTAMP', function () {
      expect(isExpressionDefault('CURRENT_TIMESTAMP')).to.be.true;
    });

    it('detects CURRENT_TIMESTAMP with precision', function () {
      expect(isExpressionDefault('CURRENT_TIMESTAMP(3)')).to.be.true;
      expect(isExpressionDefault('CURRENT_TIMESTAMP(6)')).to.be.true;
      expect(isExpressionDefault('CURRENT_TIMESTAMP(0)')).to.be.true;
    });

    it('detects CURRENT_TIMESTAMP case-insensitively', function () {
      expect(isExpressionDefault('current_timestamp')).to.be.true;
      expect(isExpressionDefault('Current_Timestamp')).to.be.true;
    });

    it('detects CURRENT_DATE', function () {
      expect(isExpressionDefault('CURRENT_DATE')).to.be.true;
      expect(isExpressionDefault('current_date')).to.be.true;
    });

    it('detects CURRENT_TIME', function () {
      expect(isExpressionDefault('CURRENT_TIME')).to.be.true;
      expect(isExpressionDefault('CURRENT_TIME(3)')).to.be.true;
    });

    it('detects NOW()', function () {
      expect(isExpressionDefault('NOW()')).to.be.true;
      expect(isExpressionDefault('NOW(3)')).to.be.true;
      expect(isExpressionDefault('now()')).to.be.true;
    });

    it('detects LOCALTIME', function () {
      expect(isExpressionDefault('LOCALTIME')).to.be.true;
      expect(isExpressionDefault('LOCALTIME(3)')).to.be.true;
    });

    it('detects LOCALTIMESTAMP', function () {
      expect(isExpressionDefault('LOCALTIMESTAMP')).to.be.true;
      expect(isExpressionDefault('LOCALTIMESTAMP(6)')).to.be.true;
    });

    it('detects UTC_TIMESTAMP', function () {
      expect(isExpressionDefault('UTC_TIMESTAMP')).to.be.true;
      expect(isExpressionDefault('UTC_TIMESTAMP(3)')).to.be.true;
    });

    it('detects UTC_DATE', function () {
      expect(isExpressionDefault('UTC_DATE')).to.be.true;
    });

    it('detects UTC_TIME', function () {
      expect(isExpressionDefault('UTC_TIME')).to.be.true;
      expect(isExpressionDefault('UTC_TIME(6)')).to.be.true;
    });
  });

  describe('UUID functions', function () {
    it('detects UUID()', function () {
      expect(isExpressionDefault('UUID()')).to.be.true;
      expect(isExpressionDefault('uuid()')).to.be.true;
    });

    it('detects UUID_SHORT()', function () {
      expect(isExpressionDefault('UUID_SHORT()')).to.be.true;
    });

    it('detects UUID_TO_BIN()', function () {
      expect(isExpressionDefault('UUID_TO_BIN(UUID())')).to.be.true;
    });
  });

  describe('MySQL 8.0+ expression defaults in parentheses', function () {
    it('detects parenthesized expressions', function () {
      expect(isExpressionDefault('(10 + 5)')).to.be.true;
      expect(isExpressionDefault('(UUID())')).to.be.true;
      expect(isExpressionDefault('(CURRENT_TIMESTAMP)')).to.be.true;
    });

    it('detects complex parenthesized expressions', function () {
      expect(isExpressionDefault("(JSON_OBJECT('key', 'value'))")).to.be.true;
      expect(isExpressionDefault("(CONCAT('prefix_', UUID()))")).to.be.true;
    });
  });

  describe('DEFAULT_GENERATED in Extra', function () {
    it('detects expression defaults via Extra field', function () {
      expect(isExpressionDefault('some_value', 'DEFAULT_GENERATED')).to.be.true;
    });

    it('detects expression defaults with on update in Extra', function () {
      expect(
        isExpressionDefault(
          'CURRENT_TIMESTAMP',
          'DEFAULT_GENERATED on update CURRENT_TIMESTAMP'
        )
      ).to.be.true;
    });

    it('is case-insensitive for Extra field', function () {
      expect(isExpressionDefault('some_value', 'default_generated')).to.be.true;
    });
  });

  describe('literal values that should NOT be detected as expressions', function () {
    it('returns false for plain string defaults', function () {
      expect(isExpressionDefault('hello')).to.be.false;
      expect(isExpressionDefault('world')).to.be.false;
    });

    it('returns false for numeric string defaults', function () {
      expect(isExpressionDefault('42')).to.be.false;
      expect(isExpressionDefault('3.14')).to.be.false;
      expect(isExpressionDefault('-1')).to.be.false;
      expect(isExpressionDefault('0')).to.be.false;
    });

    it('returns false for boolean-like defaults', function () {
      expect(isExpressionDefault('true')).to.be.false;
      expect(isExpressionDefault('false')).to.be.false;
      expect(isExpressionDefault('1')).to.be.false;
    });

    it('returns false for JSON-like string defaults', function () {
      expect(isExpressionDefault('{"key": "value"}')).to.be.false;
    });

    it('returns false for strings that look vaguely like functions', function () {
      expect(isExpressionDefault('not_a_function')).to.be.false;
      expect(isExpressionDefault('CURRENT_TIMESTAMP_extra_text')).to.be.false;
    });

    it('returns false for null/undefined', function () {
      expect(isExpressionDefault(null)).to.be.false;
      expect(isExpressionDefault(undefined)).to.be.false;
    });

    it('returns false for empty string', function () {
      expect(isExpressionDefault('')).to.be.false;
    });

    it('returns false when Extra is auto_increment only', function () {
      expect(isExpressionDefault('0', 'auto_increment')).to.be.false;
    });
  });
});
