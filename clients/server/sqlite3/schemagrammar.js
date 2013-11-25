// SQLite3 SchemaGrammar
// -------
var _                 = require('lodash');
var baseSchemaGrammar = require('../../base/sqlite3/schemagrammar').schemaGrammar;

exports.schemaGrammar = _.defaults({

  // Ensures the response is returned in the same format as other clients.
  handleResponse: function(builder, resp) {
    // This is an array, so we'll assume that the relevant info is on the first statement...
    resp = resp[0];
    var ctx = resp[1]; resp = resp[0];
    if (builder.type === 'tableExists') {
      return resp.length > 0;
    } else if (builder.type === 'columnExists') {
      return _.findWhere(resp, {name: builder.bindings[1]}) != null;
    }
    return resp;
  }

}, baseSchemaGrammar);
