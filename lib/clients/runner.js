var _ = require('lodash');
var Promise = require('../promise');

// The "Runner" class takes the database client and the
// query object and attempts to run the query, firing events when doing so.
var Runner = module.exports = function Runner(client, connection, flags) {
  this.client     = client;
  this.connection = connection;
  this.flags      = flags;
};

_.extend(Runner.prototype, {

  transactionCounter: 0,

  debug: function Runner$debug(target, connection) {
    console.log({sql: target.sql, bindings: target.bindings, __cid: connection.__cid});
  },

  run: function Runner$run(target, method) {
    if (_.isArray(target)) {
      var runner = this;
      if (target.length === 1) {
        return this.query(target[0]);
      }
      return Promise.reduce(target, function(memo, block) {
        return runner.run(block).then(function(resp) {
          memo.push(resp);
          return memo;
        });
      }, []);
    } else {
      return this.query(target, method);
    }
  },

  // Shell out to the client's "query" method, checking if there is a `target.output` method
  // and if so
  query: Promise.method(function Runner$query(target, method) {
    var flags = this.flags.options ? _.extend.apply(_, this.flags.options) : null;
    if (this.isDebugging()) this.debug(target, this.connection);
    return this.client.execute(this.connection, target, flags, method)
      .then(this.client.processResponse(this, target, method));
  }),

  isDebugging: function() {
    return (this.client.isDebugging === true || this.flags.debug === true);
  }

});