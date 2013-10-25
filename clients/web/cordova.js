// SQLite3 - Cordova (PhoneGap)
// ----------
(function(define) {

"use strict";

define(function(require, exports, module) {

  var Sqlite3 = require('../base/sqlite3');

  var Cordova = Sqlite3.extend({

    query: function() {

    },

    getConnection: function() {
      window.openDatabase(/* name, version, display_name, size */);
    }

  });

  module.exports = Cordova;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);