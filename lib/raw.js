// Raw
// -------
var _ = require('lodash');

var Common  = require('./common').Common;

var Raw = function(instance) {
  this.knex   = instance;
  this.client = instance.client;
  this.flags  = {};
};

_.extend(Raw.prototype, Common, {

  _source: 'Raw',

  // Set the sql and the bindings associated with the query, returning
  // the current raw object.
  query: function(sql, bindings) {
    this.bindings = _.isArray(bindings) ? bindings :
      bindings ? [bindings] : [];
    this.sql = sql;
    return this;
  },

  // Returns the raw sql for the query.
  toSql: function() {
    return this.sql;
  },

  // Returns the cleaned bindings for the current raw query.
  getBindings: function() {
    return this.client.grammar.getBindings(this);
  },

  // Clones the current raw query.
  clone: function() {
    var item = new Raw(this.knex);

    item.sql      = this.sql;
    item.bindings = this.bindings.slice();

    return item;
  }

});

exports.Raw = Raw;
