const { expect } = require('chai');
const {
  isString,
  isNumber,
  isBoolean,
  isNull,
  isDate,
  isPrimitive,
  isSafeObject,
  isSafeArray,
  isSafeValue,
} = require('../../../lib/util/is');

describe('is utility functions', () => {
  describe('isPrimitive', () => {
    it('should return true for strings', () => {
      expect(isPrimitive('hello')).to.be.true;
    });

    it('should return true for numbers', () => {
      expect(isPrimitive(42)).to.be.true;
      expect(isPrimitive(0)).to.be.true;
    });

    it('should return true for booleans', () => {
      expect(isPrimitive(true)).to.be.true;
      expect(isPrimitive(false)).to.be.true;
    });

    it('should return true for null', () => {
      expect(isPrimitive(null)).to.be.true;
    });

    it('should return true for valid Date objects', () => {
      expect(isPrimitive(new Date())).to.be.true;
    });

    it('should return false for objects', () => {
      expect(isPrimitive({})).to.be.false;
    });

    it('should return false for arrays', () => {
      expect(isPrimitive([])).to.be.false;
    });

    it('should return false for Date objects with overridden toJSON', () => {
      const date = new Date();
      date.toJSON = () => 'malicious';
      expect(isPrimitive(date)).to.be.false;
    });
  });

  describe('isSafeObject', () => {
    it('should return true for objects with primitive properties', () => {
      expect(isSafeObject({ a: 'hello', b: 42, c: true })).to.be.true;
    });

    it('should return false for objects with nested objects', () => {
      expect(isSafeObject({ a: 'hello', b: { nested: 'object' } })).to.be.false;
    });

    it('should return false for objects with arrays', () => {
      expect(isSafeObject({ a: 'hello', b: [1, 2, 3] })).to.be.false;
    });

    it('should return false for null', () => {
      expect(isSafeObject(null)).to.be.false;
    });

    it('should return false for arrays', () => {
      expect(isSafeObject([])).to.be.false;
    });
  });

  describe('isSafeArray', () => {
    it('should return true for arrays of primitives', () => {
      expect(isSafeArray([1, 2, 3])).to.be.true;
      expect(isSafeArray(['a', 'b', 'c'])).to.be.true;
    });

    it('should return false for arrays with objects', () => {
      expect(isSafeArray([1, { a: 'object' }, 3])).to.be.false;
    });

    it('should return false for arrays with nested arrays', () => {
      expect(isSafeArray([1, [2, 3], 4])).to.be.false;
    });

    it('should return false for objects', () => {
      expect(isSafeArray({})).to.be.false;
    });

    it('should return false for null', () => {
      expect(isSafeArray(null)).to.be.false;
    });
  });

  describe('isSafeValue', () => {
    it('should return true for primitives', () => {
      expect(isSafeValue('hello')).to.be.true;
      expect(isSafeValue(42)).to.be.true;
      expect(isSafeValue(true)).to.be.true;
      expect(isSafeValue(null)).to.be.true;
    });

    it('should return true for safe objects', () => {
      expect(isSafeValue({ a: 'hello', b: 42 })).to.be.true;
    });

    it('should return true for safe arrays', () => {
      expect(isSafeValue([1, 2, 3])).to.be.true;
    });

    it('should return false for unsafe objects', () => {
      expect(isSafeValue({ a: 'hello', b: { nested: 'object' } })).to.be.false;
    });

    it('should return false for unsafe arrays', () => {
      expect(isSafeValue([1, { a: 'object' }, 3])).to.be.false;
    });

    it('should return false for functions', () => {
      expect(isSafeValue(() => {})).to.be.false;
    });
  });
});