'use strict';
const {
  augmentWithBuilderInterface,
} = require('../../lib/builder-interface-augmenter');
const chai = require('chai');

describe('interface', function () {
  it('catch and rethrow with an async stack trace', function (done) {
    const error = new Error('Some SQL error');
    function SomeClass() {
      this.client = {
        config: {
          asyncStackTraces: true,
        },
        runner: function () {
          return {
            run: function () {
              return {
                catch: function (rethrow) {
                  rethrow.call(fakeInstance, error); // by calling here we're simulating that the promise was rejected
                  chai
                    .expect(error.stack)
                    .to.equal('Error: Some SQL error\nline1\nline2\nline3');
                  done();
                },
                then: function () {},
              };
            },
          };
        },
      };
    }

    augmentWithBuilderInterface(SomeClass);

    const fakeInstance = new SomeClass();
    chai.expect(fakeInstance[Symbol.toStringTag]).to.eq('object');
    fakeInstance._asyncStack = {
      error: { stack: 'line1\nline2\nline3' },
      lines: 0,
    };
    fakeInstance.then();
  });
});
