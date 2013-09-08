var Common  = require('../../lib/common').Common;

var CommonStub = function(knex) {
  this.knex = knex;
  this.client = client;
  this.grammar = client.grammar;
};
CommonStub.prototype = Common;

describe('Common', function () {

  var common;

  beforeEach(function() {
    common = new CommonStub();
  });

  describe('debug', function () {

    it('should set the flag for the isDebugging property of the object');

  });

  describe('exec', function() {

    it('should accept a callback, which provides an err / success');

    it('should rethrow any error in the handler');

  });

  describe('then', function() {

    it('should accept two functions, which are passed along to the promise handler');

  });

  describe('tap', function () {

    it('is essentially a passthrough to the `tap` method of when.js');

  });

  describe('toString', function() {

    it('turns the current query into a string value, based on the current client');

  });

  describe('connection', function() {

    it('should set the usingConnection property of the current object');

  });

  describe('transacting', function () {

    it('should set the transaction object');

  });

});