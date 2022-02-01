'use strict';

const { expect } = require('chai');
const { isMssql } = require('../../util/db-helpers');

module.exports = function (knex) {
  it('#test decimal mssql should allow large numbers', function () {
    // https://github.com/tediousjs/tedious/issues/1058
    if (!isMssql(knex)) {
      return Promise.resolve();
    }
    const tableName = 'decimal_test';
    const testDecimal = 12345678901234.56;
    return knex
      .transaction(function (tr) {
        return tr.schema.dropTableIfExists(tableName).then(function () {
          return tr.schema.createTable(tableName, function (table) {
            table.decimal('largeDecimal', 38, 10);
          });
        });
      })
      .then(function () {
        return knex(tableName).insert({
          largeDecimal: testDecimal,
        });
      })
      .then(function () {
        return knex(tableName).select('*');
      })
      .then(function (result) {
        expect(result[0].largeDecimal).to.equal(testDecimal);
      })
      .catch(function (err) {
        throw new Error('Test should not throw an error');
      });
  });
  it('#test decimal mssql should allow numbers with precision of 10', function () {
    if (!isMssql(knex)) {
      return Promise.resolve();
    }
    const tableName = 'decimal_test';
    const testDecimal = 0.1234567891;
    return knex
      .transaction(function (tr) {
        return tr.schema.dropTableIfExists(tableName).then(function () {
          return tr.schema.createTable(tableName, function (table) {
            table.decimal('largeDecimal', 38, 10);
          });
        });
      })
      .then(function () {
        return knex(tableName).insert({
          largeDecimal: testDecimal,
        });
      })
      .then(function () {
        return knex(tableName).select('*');
      })
      .then(function (result) {
        expect(result[0].largeDecimal).to.equal(testDecimal);
      })
      .catch(function (err) {
        throw new Error('Test should not throw an error');
      });
  });
  it('#test decimal mssql should allow numbers with precision of 16', function () {
    // Plain JavaScript cannot handle higher numbers without losing precision.
    if (!isMssql(knex)) {
      return Promise.resolve();
    }
    const tableName = 'decimal_test';
    const testDecimal = 1234567890123456;
    return knex
      .transaction(function (tr) {
        return tr.schema.dropTableIfExists(tableName).then(function () {
          return tr.schema.createTable(tableName, function (table) {
            table.decimal('largeDecimal', 38, 10);
          });
        });
      })
      .then(function () {
        return knex(tableName).insert({
          largeDecimal: testDecimal,
        });
      })
      .then(function () {
        return knex(tableName).select('*');
      })
      .then(function (result) {
        expect(result[0].largeDecimal).to.equal(testDecimal);
      })
      .catch(function (err) {
        throw new Error('Test should not throw an error');
      });
  });
};
