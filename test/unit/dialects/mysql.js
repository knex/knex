'use strict';
const expect = require('chai').expect;
const knex = require('../../../knex');

describe('MySQL unit tests', () => {
  const qb = knex({
    client: 'mysql',
    connection: {
      port: 1433,
      host: '127.0.0.1',
      password: 'yourStrong(!)Password',
      user: 'sa',
    },
  });

  it('should pass with plain values or with emtpy raw bindings', () => {
    expect(qb('users').select('*').where('id', '=', 1).toString()).to.equal(
      'select * from `users` where `id` = 1'
    );
    expect(qb('users').select('*').where({ id: 1 }).toString()).to.equal(
      'select * from `users` where `id` = 1'
    );
    expect(qb('users').select('*').whereRaw('?? = ?').toString()).to.equal(
      'select * from `users` where ?? = ?'
    );
  });

  it('should fail if provided value is array in basic where query #1227', () => {
    try {
      qb('users').select('*').where('id', '=', [0]).toString();
      throw new Error('Should not reach this point');
    } catch (error) {
      expect(error.message).to.equal(
        'The values in where clause must not be object or array.'
      );
    }
  });

  it('should fail if provided value is object in basic where query #1227', () => {
    try {
      qb('users').select('*').where('id', '=', { test: 'test ' }).toString();
      throw new Error('Should not reach this point');
    } catch (error) {
      expect(error.message).to.equal(
        'The values in where clause must not be object or array.'
      );
    }
  });

  it('should fail if provided raw query with array value in bindings #1227', () => {
    try {
      qb('users')
        .select('*')
        .where(qb.raw('?? = ?', ['id', [0]]))
        .toString();
      throw new Error('Should not reach this point');
    } catch (error) {
      expect(error.message).to.equal(
        'The values in where clause must not be object or array.'
      );
    }
  });

  it('should fail if provided raw query with object value in bindings #1227', () => {
    try {
      qb('users')
        .select('*')
        .where(qb.raw('?? = ?', ['id', { a: 1 }]))
        .toString();
      throw new Error('Should not reach this point');
    } catch (error) {
      expect(error.message).to.equal(
        'The values in where clause must not be object or array.'
      );
    }
  });

  it('should fail if value in bindings is object in whereRaw #1227', () => {
    try {
      qb('users')
        .select('*')
        .whereRaw('?? = ?', ['id', { test: 'test' }])
        .toString();
      throw new Error('Should not reach this point');
    } catch (error) {
      expect(error.message).to.equal(
        'The values in where clause must not be object or array.'
      );
    }
  });
});
