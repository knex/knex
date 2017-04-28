// global it, describe, expect

'use strict';
var _ = require('lodash');
var expect = require('chai').expect;
var knex   = require('../../../knex');
var config = require('../../knexfile');

describe("OracleDb externalAuth", function() {
  var knexInstance = knex({
    client: 'oracledb',
    connection: {
      user          : "user",
      password      : "password",
      connectString : 'connect-string',
      externalAuth  : true,
      host          : "host",
      database      : "database"
    }
  });
  var spy;

  before(function() {
    spy = sinon.spy(knexInstance.client.driver, "getConnection");
  });

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

  after(function() {
    sinon.restore(knexInstance.client.driver.getConnection);
  });

});

describe("OracleDb parameters", function() {

  describe("with fetchAsString parameter", function() {
    var knexClient;

    before(function() {
      var conf = _.clone(config.oracledb);
      conf.fetchAsString = [ 'number', 'DATE', 'cLOb'];
      knexClient = knex(conf);
      return knexClient;
    });

    it('on float', function() {
      return knexClient.raw('select 7.329 as "field" from dual').then(function(result) {
        expect(result[0]).to.be.ok;
        expect(result[0].field).to.be.a('string');
      })
    });

    it('on date', function() {
      return knexClient.raw('select CURRENT_DATE as "field" from dual').then(function(result) {
        expect(result[0]).to.be.ok;
        expect(result[0].field).to.be.a('string');
      })
    });

    after(function() {
      return knexClient.destroy();
    });

  });

  describe("without fetchAsString parameter", function() {
    var knexClient;

    before(function() {
      knexClient = knex(config.oracledb);
      return knexClient;
    });

    it('on float', function() {
      return knexClient.raw('select 7.329 as "field" from dual').then(function(result) {
        expect(result[0]).to.be.ok;
        expect(result[0].field).to.not.be.a('string');
      })
    });

    it('on date', function() {
      return knexClient.raw('select CURRENT_DATE as "field" from dual').then(function(result) {
        expect(result[0]).to.be.ok;
        expect(result[0].field).to.not.be.a('string');
      })
    });

    after(function() {
      return knexClient.destroy();
    });

  });

});
