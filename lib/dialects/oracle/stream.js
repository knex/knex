'use strict';

exports.__esModule = true;

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _stream = require('stream');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*jslint node:true, nomen: true*/
function OracleQueryStream(connection, sql, bindings, options) {
  _stream.Readable.call(this, (0, _merge3.default)({}, {
    objectMode: true,
    highWaterMark: 1000
  }, options));
  this.oracleReader = connection.reader(sql, bindings || []);
}
(0, _inherits2.default)(OracleQueryStream, _stream.Readable);

OracleQueryStream.prototype._read = function () {
  var _this = this;

  var pushNull = function pushNull() {
    process.nextTick(function () {
      _this.push(null);
    });
  };
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

exports.default = OracleQueryStream;
module.exports = exports['default'];