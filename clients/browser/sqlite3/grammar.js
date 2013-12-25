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
    if (builder.type === 'select') {
      var obj = [];
      for (var i = 0, l = resp.rows.length; i < l; i++) {
        obj[i] = _.clone(resp.rows.item(i));
      }
      return obj;
    } else if (builder.type === 'insert') {
      resp = [resp.insertId];
    } else if (builder.type === 'delete' || builder.type === 'update') {
      resp = resp.rowsAffected;
    }
    return resp;
  }

}, baseGrammar);