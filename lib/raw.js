
  var _ = require('underscore');
  var Common = require('./common').Common;

  var Raw = function(sql, bindings) {
    this.bindings = (!_.isArray(bindings) ? (bindings ? [bindings] : []) : bindings);
    this.sql = sql;
  };

  _.extend(Raw.prototype, {

    _source: 'Raw',

    // Returns the raw sql for the query.
    toSql: function() {
      return this.sql;
    }

  });

  exports.Raw = Raw;
