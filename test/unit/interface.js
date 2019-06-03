'use strict';
/*global describe, it*/
const _interface = require('../../src/interface');
const chai = require('chai');

describe('interface', function() {
  it('catch and rethrow with an async stack trace', function(done) {
    const error = new Error('Some SQL error');
    function SomeClass() {
      this.client = {
        config: {
          asyncStackTraces: true,
        },
        runner: function() {
          return {
            run: function() {
              return {
                catch: function(rethrow) {
                  rethrow.call(fakeInstance, error); // by calling here we're simulating that the promise was rejected
                  chai
                    .expect(error.stack)
                    .to.equal('Error: Some SQL error\nline1\nline2\nline3');
                  done();
                },
                then: function() {},
              };
            },
          };
        },
      };
    }

    _interface(SomeClass);
    const fakeInstance = new SomeClass();
    fakeInstance._asyncStack = ['line1', 'line2', 'line3'];
    fakeInstance.then();
  });
});
