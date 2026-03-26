'use strict';
const {
  augmentWithBuilderInterface,
} = require('../../lib/builder-interface-augmenter');

describe('interface', function () {
  it('catch and rethrow with an async stack trace', function () {
    return new Promise(function (resolve) {
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
                    try {
                      rethrow.call(fakeInstance, error); // by calling here we're simulating that the promise was rejected
                    } catch (e) {
                      // rethrow function throws the error after modifying the stack
                    }
                    expect(error.stack).toBe(
                      'Error: Some SQL error\nline1\nline2\nline3'
                    );
                    resolve();
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
      expect(fakeInstance[Symbol.toStringTag]).toBe('object');
      fakeInstance._asyncStack = {
        error: { stack: 'line1\nline2\nline3' },
        lines: 0,
      };
      fakeInstance.then();
    });
  });
});
