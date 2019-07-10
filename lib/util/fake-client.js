const Formatter = require('../formatter');

const fakeClient = {
  formatter(builder) {
    return new Formatter(fakeClient, builder);
  },
};

module.exports = fakeClient;
