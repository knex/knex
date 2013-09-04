(function(define) {

"use strict";

define(function(require, exports) {

  var Sqlite3 = require('../base/sqlite3');

  var WebSQL = Sqlite3.extend({

  });

  exports.WebSQL = WebSQL;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);