
var MysqlClient = require('../../../../clients/server/mysql');

describe('MysqlClient', function () {

  describe('initialize', function () {

    it('binds runQuery to the current context on initialize');

  });

  describe('query', function () {

    it('takes a builder instance');

    it('calls the debug function if the debug is set on the builder or on the client');

    it('checks whether an additional query is needed for DDL info');

    it('calls the queries in sequence on the same connection if there is an array of queries.');

    it('augments the error with the sql if the current query fails');

    it('releases the query, unless the connection was explicitly passed');

  });

  describe('runQuery', function() {

    it('runs the query on the connection, with the sql and bindings');

    it('resolves with the builder.handleResponse method');

  });

  describe('checkSchema', function() {

  });

  describe('getRawConnection', function() {

  });

  describe('grammar', function () {

    it('has a wrapValue method which wraps any non * value with ``');

  });

  describe('schemaGrammar', function () {

    it('has a compileCreateTable method');
    it('has a compileTableExists method');
    it('has a compileColumnExists method');
    it('has a compileAdd method');
    it('has a compilePrimary method');
    it('has a compileUnique method');
    it('has a compileIndex method');
    it('has a compileKey method');
    it('has a compileDropColumn method');
    it('has a compileDropPrimary method');
    it('has a compileDropUnique method');
    it('has a compileDropIndex method');
    it('has a compileDropForeign method');
    it('has a compileRenameTable method');
    it('has a compileRenameColumn method');
    it('has a compileComment method');
    it('has a typeText method');
    it('has a typeBigInteger method');
    it('has a typeInteger method');
    it('has a typeFloat method');
    it('has a typeDecimal method');
    it('has a typeBoolean method');
    it('has a typeEnum method');
    it('has a typeDateTime method');
    it('has a typeTimestamp method');
    it('has a typeBit method');
    it('has a modifyUnsigned method');
    it('has a modifyDefault method');
    it('has a modifyIncrement method');
    it('has a modifyAfter method');
    it('has a modifyComment method');

  });


});
