/*global it, describe, expect*/

'use strict';
var expect = require('chai').expect;
var knex   = require('../../../knex');
var knexInstance = knex(
      {
          client: 'oracledb',
          connection: {
            user          : "user",
            password      : "password",
            connectString : 'connect-string',
            externalAuth  : true,
            host          : "host",
            database      : "database"
          }
      }
  );
var spy;

beforeEach(function() {
    spy = sinon.spy(knexInstance.client.driver, "getConnection");
});

afterEach(function() {
  sinon.restore(knexInstance.client.driver.getConnection);
});

describe("OracleDb externalAuth", function() {
  it('externalAuth and connectString should be sent to the getConnection', function() {
      var connectionWithExternalAuth = {
          connectString: "connect-string",
          externalAuth: true
      }
      knexInstance.client.acquireRawConnection().then(
          function(resolve) {},
          function(reject) {}
      );
      expect(spy).to.have.callCount(1);
      expect(spy).to.have.been.calledWith(connectionWithExternalAuth);
  });
});
