// SQLite3 - WebSQL
// ----------
(function(define) {

"use strict";

define(function(require, exports, module) {

  var SQLite3 = require('./sqlite3');

  // Constructor for the WebSQL client.
  var WebSQL = SQLite3.extend({

  });

  module.exports = WebSQL;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);