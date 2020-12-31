'use strict';
const saveAsyncStack = require('../../../lib/util/save-async-stack');
const chai = require('chai');

describe('saveAsyncStack', function () {
  it('should store an error stack on passed object', function () {
    const fakeInstance = {
      client: {
        config: {
          asyncStackTraces: true,
        },
      },
    };
    saveAsyncStack(fakeInstance, 1);

    const { error, lines } = fakeInstance._asyncStack;
    const stackByLines = error.stack.split('\n');
    const asyncStack = stackByLines.slice(lines);

    chai.expect(asyncStack[0]).to.match(/at saveAsyncStack /);
  });

  it('should not store an error stack when config is disabled', function () {
    const fakeInstance = {
      client: {
        config: {},
      },
    };
    saveAsyncStack(fakeInstance, 1);
    chai.expect(fakeInstance._asyncStack).to.be.undefined;
  });
});
