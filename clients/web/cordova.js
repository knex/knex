(function(define) {

"use strict";

define(function(require, exports) {

  var Sqlite3 = require('../base/sqlite3');

  var Cordova = Sqlite3.extend({

    query: function() {

    },

    getConnection: function() {
      window.openDatabase(/* name, version, display_name, size */);
    }

  });

  exports.Cordova = Cordova;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);