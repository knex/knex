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
  this.timeout(20000);
  const conf = _.clone(config.oracledb);
  conf.fetchAsString = [ 'number', 'DATE', 'cLOb'];
  const knexClient = knex(conf);

  before(function(done) {
    knexClient.schema.createTable('fetchAsStringTable', function (table) {
      table.increments();
      table.float('testfloat');
      table.date('testdate');
    }).then(function() {
      knexClient('fetchAsStringTable').insert({
        testfloat: 7.32,
        testdate: new Date(2017, 5, 7)
      }).then(function() {
        done();
      }).catch(done);
    }).catch(done);
  });

  it('fetchAsString parameter should return strings on selected types', function(done) {
    knexClient('fetchAsStringTable').select().then(function(result) {
      expect(result[0]).to.be.ok;
      expect(result[0].testfloat).to.be.a('string');
      expect(result[0].testdate).to.be.a('string');
      done();
    }).catch(done);
  });

  after(function(done) {
    knexClient.schema.dropTable('fetchAsStringTable').then(function() {
      done();
    }).catch(done);
  });
});
