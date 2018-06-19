'use strict';
/*global expect, describe, it*/
var saveAsyncStack = require("../../../lib/util/save-async-stack");
var chai = require("chai");

describe('saveAsyncStack', function () {
  it('should store an error stack on passed object', function () {
    var fakeInstance = {
      client: {
        config: {
          asyncStackTraces: true
      }
    }}
    saveAsyncStack(fakeInstance, 1)

    chai.expect(fakeInstance._asyncStack[0]).to.match(/at saveAsyncStack /)
  })

  it('should not store an error stack when config is disabled', function () {
    var fakeInstance = {
      client: {
        config: {}
    }}
    saveAsyncStack(fakeInstance, 1)
    chai.expect(fakeInstance._asyncStack).to.be.undefined
  })
})