var Helpers     = require('../../../lib/helpers').Helpers;
var baseGrammar = require('../../base/sqlite3/grammar').grammar;

exports.grammar = _.defaults({

  handleResponse: function(builder, resp) {
    var ctx = resp[1]; resp = resp[0];
    if (builder.type === 'select') {
      resp = Helpers.skim(resp);
    } else if (builder.type === 'insert') {
      resp = [ctx.lastID];
    } else if (builder.type === 'delete' || builder.type === 'update') {
      resp = ctx.changes;
    }
    return resp;
  }

}, baseGrammar);