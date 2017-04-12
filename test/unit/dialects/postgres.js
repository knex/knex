/* global it, describe */

'use strict';
var expect = require('chai').expect;
var knex   = require('../../../knex');
var knexInstance = knex({
  client: 'pg',
  connection: {
    connectString: 'connect-string',
    database: 'database',
    externalAuth: true,
    host: 'host',
    password: 'password',
    user: 'user',
  },
});

describe('PostgreSQL client', function() {
  describe('checkVersion()', function() {
    function createFakeConnection(err, resp) {
      return {
        query: function(sql, cb) {
          cb(err, resp);
        }
      }
    }

    it('should reject on error', function() {
      var error = new Error('error');
      var fakeConnection = createFakeConnection(error);

      function onSuccess() {
        throw new Error('expected test to fail');
      }
      function onError(err) {
        expect(err).to.equal(error);
      }

      return knexInstance.client.checkVersion(fakeConnection)
        .then(onSuccess, onError);
    });

    it('should resolve valid for PostgreSQL', function() {
      var resp = {
        rows: [{
          version: 'PostgreSQL 9.3.13 on x86_64-unknown, compiled by compiler 0.0.0, 64-bit',
        }]
      };
      var fakeConnection = createFakeConnection(null, resp);

      return knexInstance.client.checkVersion(fakeConnection)
        .then(function(version) {
          expect(version).to.equal('9.3.13');
        });
    });

    it('should resolve valid for EnterpriseDB', function() {
      var resp = {
        rows: [{
          version: 'EnterpriseDB 9.3.13.37 on x86_64-unknown, compiled by compiler 0.0.0, 64-bit',
        }]
      };
      var fakeConnection = createFakeConnection(null, resp);

      return knexInstance.client.checkVersion(fakeConnection)
        .then(function(version) {
          expect(version).to.equal('9.3.13.37');
        });
    });
  });
});
