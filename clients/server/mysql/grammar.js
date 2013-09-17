// MySQL Grammar
// -------

var Helpers     = require('../../../lib/helpers').Helpers;
var baseGrammar = require('../../base/grammar').baseGrammar;

// Extends the standard sql grammar.
exports.grammar = _.defaults({

  // The keyword identifier wrapper format.
  wrapValue: function(value) {
    return (value !== '*' ? Helpers.format('`%s`', value) : "*");
  },

  // Ensures the response is returned in the same format as other clients.
  handleResponse: function(builder, response) {
    response = response[0];
    if (builder.type === 'select') response = Helpers.skim(response);
    if (builder.type === 'insert') response = [response.insertId];
    if (builder.type === 'delete' || builder.type === 'update') response = response.affectedRows;
    return response;
  }

}, baseGrammar);