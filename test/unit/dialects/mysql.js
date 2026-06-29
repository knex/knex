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

  it('columnInfo() handles lowercase INFORMATION_SCHEMA keys from mysql2 #6391', () => {
    const { output } = qb('users').columnInfo().toSQL();

    const expected = {
      id: {
        defaultValue: null,
        type: 'int',
        maxLength: null,
        nullable: false,
      },
      email: {
        defaultValue: null,
        type: 'varchar',
        maxLength: 255,
        nullable: true,
      },
    };

    // mysql2 may return INFORMATION_SCHEMA column names in lowercase
    // depending on server configuration.
    const lowercaseResp = [
      {
        column_name: 'id',
        column_default: null,
        data_type: 'int',
        character_maximum_length: null,
        is_nullable: 'NO',
      },
      {
        column_name: 'email',
        column_default: 'NULL',
        data_type: 'varchar',
        character_maximum_length: 255,
        is_nullable: 'YES',
      },
    ];

    const uppercaseResp = [
      {
        COLUMN_NAME: 'id',
        COLUMN_DEFAULT: null,
        DATA_TYPE: 'int',
        CHARACTER_MAXIMUM_LENGTH: null,
        IS_NULLABLE: 'NO',
      },
      {
        COLUMN_NAME: 'email',
        COLUMN_DEFAULT: 'NULL',
        DATA_TYPE: 'varchar',
        CHARACTER_MAXIMUM_LENGTH: 255,
        IS_NULLABLE: 'YES',
      },
    ];

    expect(output(lowercaseResp)).to.eql(expected);
    expect(output(uppercaseResp)).to.eql(expected);
  });
});
