'use strict';
const expect = require('chai').expect;
const knex = require('../../../knex');
const Client_MySQL2 = require('../../../lib/dialects/mysql2');

describe('MySQL2 validateConnection', () => {
  const client = new Client_MySQL2({ client: 'mysql2' });

  it('should use the public state getter when mysql2 provides it (#6255)', () => {
    const connection = (state) => ({ state, stream: { destroyed: false } });

    expect(client.validateConnection(connection('authenticated'))).to.equal(
      true
    );
    expect(client.validateConnection(connection('connected'))).to.equal(true);
    expect(client.validateConnection(connection('error'))).to.equal(false);
    expect(client.validateConnection(connection('disconnected'))).to.equal(
      false
    );
    expect(
      client.validateConnection(connection('protocol_handshake'))
    ).to.equal(false);
  });

  it('should fall back to the internal fields for mysql2 versions without the state getter', () => {
    const connection = (fields) => ({
      _fatalError: null,
      _protocolError: null,
      _closing: false,
      stream: { destroyed: false },
      ...fields,
    });

    expect(client.validateConnection(connection({}))).to.equal(true);
    expect(
      client.validateConnection(connection({ _fatalError: new Error('x') }))
    ).to.equal(false);
    expect(
      client.validateConnection(connection({ _protocolError: new Error('x') }))
    ).to.equal(false);
    expect(client.validateConnection(connection({ _closing: true }))).to.equal(
      false
    );
    expect(
      client.validateConnection(connection({ stream: { destroyed: true } }))
    ).to.equal(false);
  });

  it('should not validate a missing connection', () => {
    expect(client.validateConnection(undefined)).to.not.be.ok;
  });
});

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
