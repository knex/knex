'use strict';

const parseConnection = require('../../lib/knex-builder/internal/parse-connection');
const test = require('tape');

test('parses standard connections', function (t) {
  t.plan(1);
  t.deepLooseEqual(
    parseConnection('postgres://username:pass@path.to.some-url:6000/testdb'),
    {
      client: 'postgres',
      connection: {
        user: 'username',
        password: 'pass',
        port: '6000',
        host: 'path.to.some-url',
        database: 'testdb',
      },
    }
  );
});

test('parses standard connections without password', function (t) {
  t.plan(1);
  t.deepEqual(
    parseConnection('mysql://username@path.to.some-url:3306/testdb'),
    {
      client: 'mysql',
      connection: {
        user: 'username',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    }
  );
});

test('mysql connection protocol with query string params', function (t) {
  t.plan(1);
  t.deepEqual(
    parseConnection(
      'mysql://user:pass@path.to.some-url:3306/testdb?foo=bar&anotherParam=%2Fa%2Fb%2Fc'
    ),
    {
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
    }
  );
});

test('mysql connection protocol allows skip username', function (t) {
  t.plan(1);
  t.deepEqual(
    parseConnection(
      'mysql://:pass@path.to.some-url:3306/testdb?foo=bar&anotherParam=%2Fa%2Fb%2Fc'
    ),
    {
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
    }
  );
});

test('mysql connection protocol allows skip password', function (t) {
  t.plan(1);
  t.deepEqual(
    parseConnection('mysql://username@path.to.some-url:3306/testdb'),
    {
      client: 'mysql',
      connection: {
        user: 'username',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    }
  );
});

test('mysql connection protocol allows empty password', function (t) {
  t.plan(1);
  t.deepEqual(
    parseConnection('mysql://username:@path.to.some-url:3306/testdb'),
    {
      client: 'mysql',
      connection: {
        user: 'username',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    }
  );
});

test('decodes username and password', function (t) {
  t.plan(1);
  t.deepEqual(parseConnection('mysql://user%3A@path.to.some-url:3306/testdb'), {
    client: 'mysql',
    connection: {
      user: 'user:',
      host: 'path.to.some-url',
      port: '3306',
      database: 'testdb',
    },
  });
});

test('do not encode password', function (t) {
  t.plan(1);
  t.deepEqual(
    parseConnection(
      'mysql://user:password-start:rest@path.to.some-url:3306/testdb?'
    ),
    {
      client: 'mysql',
      connection: {
        user: 'user',
        password: 'password-start:rest',
        host: 'path.to.some-url',
        port: '3306',
        database: 'testdb',
      },
    }
  );
});

test('parses mssql connections, aliasing host to server', function (t) {
  t.plan(1);
  const mssql = {
    client: 'mssql',
    connection: {
      user: 'username',
      password: 'pass',
      server: 'path.to.some-url',
      port: '6000',
      database: 'testdb',
    },
  };
  t.deepEqual(
    parseConnection('mssql://username:pass@path.to.some-url:6000/testdb'),
    mssql
  );
});

test('parses mssql connections, aliasing host to server and adding extra params', function (t) {
  t.plan(1);
  const mssql = {
    client: 'mssql',
    connection: {
      user: 'user',
      password: 'pass',
      server: 'path.to.some-url',
      port: '6000',
      database: 'testdb',
      param: 'value',
    },
  };
  t.deepEqual(
    parseConnection(
      'mssql://user:pass@path.to.some-url:6000/testdb?param=value'
    ),
    mssql
  );
});

test('assume a path is sqlite', function (t) {
  t.plan(1);
  t.deepEqual(parseConnection('/path/to/file.db'), {
    client: 'sqlite3',
    connection: {
      filename: '/path/to/file.db',
    },
  });
});

test('assume a relative path is sqlite', function (t) {
  t.plan(1);
  t.deepEqual(parseConnection('./path/to/file.db'), {
    client: 'sqlite3',
    connection: {
      filename: './path/to/file.db',
    },
  });
});

test('parse windows path as sqlite config', function (t) {
  t.plan(1);
  // reset process.platform to windows, reset require cache, require fresh
  // after test restore back
  const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');

  Object.defineProperty(process, 'platform', {
    value: 'win32',
  });

  const modulePath = require.resolve(
    '../../lib/knex-builder/internal/parse-connection'
  );
  const oldCache = require.cache[modulePath];
  delete require.cache[modulePath];

  const parseConnection = require('../../lib/knex-builder/internal/parse-connection');
  try {
    t.deepLooseEqual(
      parseConnection('C:\\Documents\\Newsletters\\Summer2018.pdf'),
      {
        client: 'sqlite3',
        connection: {
          filename: 'C:\\Documents\\Newsletters\\Summer2018.pdf',
        },
      }
    );
  } finally {
    Object.defineProperty(process, 'platform', originalPlatform);
    require.cache[modulePath] = oldCache;
  }
});

test('#852, ssl param with PG query string', function (t) {
  t.plan(1);
  t.deepLooseEqual(
    parseConnection('postgres://user:password@host:0000/database?ssl=true'),
    {
      client: 'postgres',
      connection: {
        host: 'host',
        port: '0000',
        user: 'user',
        password: 'password',
        database: 'database',
        ssl: true,
      },
    }
  );
});

test('support postgresql connection protocol', function (t) {
  t.plan(1);
  t.deepLooseEqual(
    parseConnection('postgresql://user:password@host:0000/database?ssl=true'),
    {
      client: 'postgresql',
      connection: {
        host: 'host',
        port: '0000',
        user: 'user',
        password: 'password',
        database: 'database',
        ssl: true,
      },
    }
  );
});
