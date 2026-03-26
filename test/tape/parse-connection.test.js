'use strict';

const parseConnection = require('../../lib/knex-builder/internal/parse-connection');

describe('parse-connection', () => {
  it('parses standard connections', () => {
    expect(
      parseConnection('postgres://username:pass@path.to.some-url:6000/testdb')
    ).toEqual({
      client: 'postgres',
      connection: {
        user: 'username',
        password: 'pass',
        port: '6000',
        host: 'path.to.some-url',
        database: 'testdb',
      },
    });
  });

  it('parses standard connections without password', () => {
    expect(
      parseConnection('mysql://username@path.to.some-url:3306/testdb')
    ).toEqual({
      client: 'mysql',
      connection: {
        user: 'username',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    });
  });

  it('mysql connection protocol with query string params', () => {
    expect(
      parseConnection(
        'mysql://user:pass@path.to.some-url:3306/testdb?foo=bar&anotherParam=%2Fa%2Fb%2Fc'
      )
    ).toEqual({
      client: 'mysql',
      connection: {
        user: 'user',
        password: 'pass',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
        foo: 'bar',
        anotherParam: '/a/b/c',
      },
    });
  });

  it('mysql connection protocol allows skip username', () => {
    expect(
      parseConnection(
        'mysql://:pass@path.to.some-url:3306/testdb?foo=bar&anotherParam=%2Fa%2Fb%2Fc'
      )
    ).toEqual({
      client: 'mysql',
      connection: {
        user: '',
        password: 'pass',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
        foo: 'bar',
        anotherParam: '/a/b/c',
      },
    });
  });

  it('mysql connection protocol allows skip password', () => {
    expect(
      parseConnection('mysql://username@path.to.some-url:3306/testdb')
    ).toEqual({
      client: 'mysql',
      connection: {
        user: 'username',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    });
  });

  it('mysql connection protocol allows empty password', () => {
    expect(
      parseConnection('mysql://username:@path.to.some-url:3306/testdb')
    ).toEqual({
      client: 'mysql',
      connection: {
        user: 'username',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    });
  });

  it('decodes username and password', () => {
    expect(
      parseConnection('mysql://user%3A@path.to.some-url:3306/testdb')
    ).toEqual({
      client: 'mysql',
      connection: {
        user: 'user:',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    });
  });

  it('do not encode password', () => {
    expect(
      parseConnection(
        'mysql://user:password-start:rest@path.to.some-url:3306/testdb?'
      )
    ).toEqual({
      client: 'mysql',
      connection: {
        user: 'user',
        password: 'password-start:rest',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    });
  });

  it('parses mssql connections, aliasing host to server', () => {
    expect(
      parseConnection('mssql://username:pass@path.to.some-url:6000/testdb')
    ).toEqual({
      client: 'mssql',
      connection: {
        user: 'username',
        password: 'pass',
        server: 'path.to.some-url',
        port: '6000',
        database: 'testdb',
      },
    });
  });

  it('parses mssql connections, aliasing host to server and adding extra params', () => {
    expect(
      parseConnection(
        'mssql://user:pass@path.to.some-url:6000/testdb?param=value'
      )
    ).toEqual({
      client: 'mssql',
      connection: {
        user: 'user',
        password: 'pass',
        server: 'path.to.some-url',
        port: '6000',
        database: 'testdb',
        param: 'value',
      },
    });
  });

  it('assume a path is sqlite', () => {
    expect(parseConnection('/path/to/file.db')).toEqual({
      client: 'sqlite3',
      connection: {
        filename: '/path/to/file.db',
      },
    });
  });

  it('assume a relative path is sqlite', () => {
    expect(parseConnection('./path/to/file.db')).toEqual({
      client: 'sqlite3',
      connection: {
        filename: './path/to/file.db',
      },
    });
  });

  it('parse windows path as sqlite config', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      'platform'
    );

    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });

    const modulePath = require.resolve(
      '../../lib/knex-builder/internal/parse-connection'
    );
    const oldCache = require.cache[modulePath];
    delete require.cache[modulePath];

    const freshParseConnection = require('../../lib/knex-builder/internal/parse-connection');
    try {
      expect(
        freshParseConnection('C:\\Documents\\Newsletters\\Summer2018.pdf')
      ).toEqual({
        client: 'sqlite3',
        connection: {
          filename: 'C:\\Documents\\Newsletters\\Summer2018.pdf',
        },
      });
    } finally {
      Object.defineProperty(process, 'platform', originalPlatform);
      require.cache[modulePath] = oldCache;
    }
  });

  it('#852, ssl param with PG query string', () => {
    expect(
      parseConnection('postgres://user:password@host:1234/database?ssl=true')
    ).toEqual({
      client: 'postgres',
      connection: {
        host: 'host',
        port: '1234',
        user: 'user',
        password: 'password',
        database: 'database',
        ssl: true,
      },
    });
  });

  it('support postgresql connection protocol', () => {
    expect(
      parseConnection(
        'postgresql://user:password@host:1234/database?ssl=true'
      )
    ).toEqual({
      client: 'postgresql',
      connection: {
        host: 'host',
        port: '1234',
        user: 'user',
        password: 'password',
        database: 'database',
        ssl: true,
      },
    });
  });

  it('#4628, supports mysql / mariadb client JSON parameters', () => {
    expect(
      parseConnection(
        'mysql://user:password@host:1234/database?ssl={"ca": "should exist"}'
      )
    ).toEqual({
      client: 'mysql',
      connection: {
        host: 'host',
        port: '1234',
        user: 'user',
        password: 'password',
        database: 'database',
        ssl: {
          ca: 'should exist',
        },
      },
    });

    expect(
      parseConnection(
        'mariadb://user:password@host:1234/database?ssl={"ca": "should exist"}'
      )
    ).toEqual({
      client: 'mariadb',
      connection: {
        host: 'host',
        port: '1234',
        user: 'user',
        password: 'password',
        database: 'database',
        ssl: {
          ca: 'should exist',
        },
      },
    });
  });

  it('support MSSQL JSON parameters for config object', () => {
    expect(
      parseConnection(
        'mssql://user:password@host/database?domain=testDomain&options={"instanceName": "TestInstance001", "readOnlyIntent": true}'
      )
    ).toEqual({
      client: 'mssql',
      connection: {
        server: 'host',
        user: 'user',
        password: 'password',
        database: 'database',
        domain: 'testDomain',
        options: {
          instanceName: 'TestInstance001',
          readOnlyIntent: true,
        },
      },
    });
  });
});
