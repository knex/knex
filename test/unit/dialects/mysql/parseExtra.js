const { expect } = require('chai');
const parseExtra = require('../../../../lib/dialects/mysql/schema/internal/parseExtra');

describe('MySQL parseExtra', function () {
  describe('auto_increment', function () {
    it('detects auto_increment', function () {
      const result = parseExtra('auto_increment');
      expect(result.isAutoIncrement).to.be.true;
      expect(result.onUpdateValue).to.be.null;
      expect(result.isDefaultGenerated).to.be.false;
    });

    it('is case-insensitive for auto_increment', function () {
      expect(parseExtra('AUTO_INCREMENT').isAutoIncrement).to.be.true;
    });
  });

  describe('ON UPDATE clause', function () {
    it('extracts ON UPDATE CURRENT_TIMESTAMP', function () {
      const result = parseExtra('on update CURRENT_TIMESTAMP');
      expect(result.onUpdateValue).to.equal('CURRENT_TIMESTAMP');
      expect(result.isAutoIncrement).to.be.false;
    });

    it('extracts ON UPDATE CURRENT_TIMESTAMP with precision', function () {
      const result = parseExtra('on update CURRENT_TIMESTAMP(3)');
      expect(result.onUpdateValue).to.equal('CURRENT_TIMESTAMP(3)');
    });

    it('extracts ON UPDATE CURRENT_TIMESTAMP(6)', function () {
      const result = parseExtra('on update CURRENT_TIMESTAMP(6)');
      expect(result.onUpdateValue).to.equal('CURRENT_TIMESTAMP(6)');
    });

    it('handles DEFAULT_GENERATED on update CURRENT_TIMESTAMP', function () {
      const result = parseExtra(
        'DEFAULT_GENERATED on update CURRENT_TIMESTAMP'
      );
      expect(result.isDefaultGenerated).to.be.true;
      expect(result.onUpdateValue).to.equal('CURRENT_TIMESTAMP');
    });

    it('handles DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)', function () {
      const result = parseExtra(
        'DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)'
      );
      expect(result.isDefaultGenerated).to.be.true;
      expect(result.onUpdateValue).to.equal('CURRENT_TIMESTAMP(3)');
    });
  });

  describe('DEFAULT_GENERATED', function () {
    it('detects DEFAULT_GENERATED', function () {
      const result = parseExtra('DEFAULT_GENERATED');
      expect(result.isDefaultGenerated).to.be.true;
      expect(result.isAutoIncrement).to.be.false;
      expect(result.onUpdateValue).to.be.null;
    });
  });

  describe('edge cases', function () {
    it('handles null input', function () {
      const result = parseExtra(null);
      expect(result.isAutoIncrement).to.be.false;
      expect(result.onUpdateValue).to.be.null;
      expect(result.isDefaultGenerated).to.be.false;
    });

    it('handles undefined input', function () {
      const result = parseExtra(undefined);
      expect(result.isAutoIncrement).to.be.false;
      expect(result.onUpdateValue).to.be.null;
      expect(result.isDefaultGenerated).to.be.false;
    });

    it('handles empty string', function () {
      const result = parseExtra('');
      expect(result.isAutoIncrement).to.be.false;
      expect(result.onUpdateValue).to.be.null;
      expect(result.isDefaultGenerated).to.be.false;
    });

    it('handles non-string input', function () {
      const result = parseExtra(42);
      expect(result.isAutoIncrement).to.be.false;
      expect(result.onUpdateValue).to.be.null;
      expect(result.isDefaultGenerated).to.be.false;
    });

    it('handles whitespace-padded input', function () {
      const result = parseExtra('  auto_increment  ');
      expect(result.isAutoIncrement).to.be.true;
    });
  });
});
