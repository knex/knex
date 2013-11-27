// SQLite3 - Cordova (PhoneGap)
// ----------
var Sqlite3 = require('../base/sqlite3');

var Cordova = Sqlite3.extend({

  query: function() {

  },

  getConnection: function() {
    window.openDatabase(/* name, version, display_name, size */);
  }

});

module.exports = Cordova;