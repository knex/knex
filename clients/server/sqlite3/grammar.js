// SQLite3 Grammar
// -------
var _           = require('lodash');
var Helpers     = require('../../../lib/helpers').Helpers;
var baseGrammar = require('../../base/sqlite3/grammar').grammar;

// Extends the base SQLite3 grammar, adding only the functions
// specific to the server.
exports.grammar = _.defaults({

  // Ensures the response is returned in the same format as other clients.
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