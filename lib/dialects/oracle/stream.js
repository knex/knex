
/*jslint node:true, nomen: true*/
'use strict';

var inherits = require('inherits');
var merge = require('lodash/object/merge');
var Readable = require('stream').Readable;

function OracleQueryStream(connection, sql, bindings, options) {
  Readable.call(this, merge({}, {
    objectMode: true,
    highWaterMark: 1000
  }, options));
  this.oracleReader = connection.reader(sql, bindings || []);
}
inherits(OracleQueryStream, Readable);

OracleQueryStream.prototype._read = function () {
  var _this = this;

  function pushNull() {
    var _this2 = this;

    process.nextTick(function () {
      _this2.push(null);
    });
  }
  try {
    this.oracleReader.nextRows(function (err, rows) {
      if (err) return _this.emit('error', err);
      if (rows.length === 0) {
        pushNull();
      } else {
        for (var i = 0; i < rows.length; i++) {
          if (rows[i]) {
            _this.push(rows[i]);
          } else {
            pushNull();
          }
        }
      }
    });
  } catch (e) {
    // Catch Error: invalid state: reader is busy with another nextRows call
    // and return false to rate limit stream.
    if (e.message === 'invalid state: reader is busy with another nextRows call') {
      return false;
    } else {
      this.emit('error', e);
    }
  }
};

module.exports = OracleQueryStream;