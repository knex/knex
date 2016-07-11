
/*jslint node:true, nomen: true*/
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _stream = require('stream');

var _lodash = require('lodash');

function OracleQueryStream(connection, sql, bindings, options) {
  _stream.Readable.call(this, _lodash.merge({}, {
    objectMode: true,
    highWaterMark: 1000
  }, options));
  this.oracleReader = connection.reader(sql, bindings || []);
}
_inherits2['default'](OracleQueryStream, _stream.Readable);

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

exports['default'] = OracleQueryStream;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9vcmFjbGUvc3RyZWFtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O3dCQUVxQixVQUFVOzs7O3NCQUNOLFFBQVE7O3NCQUVYLFFBQVE7O0FBRTlCLFNBQVMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFO0FBQzdELG1CQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsY0FBTSxFQUFFLEVBQUU7QUFDNUIsY0FBVSxFQUFFLElBQUk7QUFDaEIsaUJBQWEsRUFBRSxJQUFJO0dBQ3BCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTtBQUNaLE1BQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0NBQzNEO0FBQ0Qsc0JBQVMsaUJBQWlCLG1CQUFXLENBQUE7O0FBRXJDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsWUFBVzs7O0FBQzdDLE1BQU0sUUFBUSxHQUFHLFNBQVgsUUFBUSxHQUFTO0FBQ3JCLFdBQU8sQ0FBQyxRQUFRLENBQUMsWUFBTTtBQUNyQixZQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUNoQixDQUFDLENBQUE7R0FDSCxDQUFBO0FBQ0QsTUFBSTtBQUNGLFFBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBSztBQUN4QyxVQUFJLEdBQUcsRUFBRSxPQUFPLE1BQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUN2QyxVQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQ3JCLGdCQUFRLEVBQUUsQ0FBQTtPQUNYLE1BQU07QUFDTCxhQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNwQyxjQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNYLGtCQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtXQUNuQixNQUFNO0FBQ0wsb0JBQVEsRUFBRSxDQUFBO1dBQ1g7U0FDRjtPQUNGO0tBQ0YsQ0FBQyxDQUFBO0dBQ0gsQ0FBQyxPQUFPLENBQUMsRUFBRTs7O0FBR1YsUUFBSSxDQUFDLENBQUMsT0FBTyxLQUNYLDBEQUEwRCxFQUFFO0FBQzVELGFBQU8sS0FBSyxDQUFBO0tBQ2IsTUFBTTtBQUNMLFVBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFBO0tBQ3RCO0dBQ0Y7Q0FDRixDQUFBOztxQkFFYyxpQkFBaUIiLCJmaWxlIjoic3RyZWFtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKmpzbGludCBub2RlOnRydWUsIG5vbWVuOiB0cnVlKi9cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgeyBSZWFkYWJsZSB9IGZyb20gJ3N0cmVhbSc7XG5cbmltcG9ydCB7IG1lcmdlIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBPcmFjbGVRdWVyeVN0cmVhbShjb25uZWN0aW9uLCBzcWwsIGJpbmRpbmdzLCBvcHRpb25zKSB7XG4gIFJlYWRhYmxlLmNhbGwodGhpcywgbWVyZ2Uoe30sIHtcbiAgICBvYmplY3RNb2RlOiB0cnVlLFxuICAgIGhpZ2hXYXRlck1hcms6IDEwMDBcbiAgfSwgb3B0aW9ucykpXG4gIHRoaXMub3JhY2xlUmVhZGVyID0gY29ubmVjdGlvbi5yZWFkZXIoc3FsLCBiaW5kaW5ncyB8fCBbXSlcbn1cbmluaGVyaXRzKE9yYWNsZVF1ZXJ5U3RyZWFtLCBSZWFkYWJsZSlcblxuT3JhY2xlUXVlcnlTdHJlYW0ucHJvdG90eXBlLl9yZWFkID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHB1c2hOdWxsID0gKCkgPT4ge1xuICAgIHByb2Nlc3MubmV4dFRpY2soKCkgPT4ge1xuICAgICAgdGhpcy5wdXNoKG51bGwpXG4gICAgfSlcbiAgfVxuICB0cnkge1xuICAgIHRoaXMub3JhY2xlUmVhZGVyLm5leHRSb3dzKChlcnIsIHJvd3MpID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKVxuICAgICAgaWYgKHJvd3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHB1c2hOdWxsKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChyb3dzW2ldKSB7XG4gICAgICAgICAgICB0aGlzLnB1c2gocm93c1tpXSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHVzaE51bGwoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBDYXRjaCBFcnJvcjogaW52YWxpZCBzdGF0ZTogcmVhZGVyIGlzIGJ1c3kgd2l0aCBhbm90aGVyIG5leHRSb3dzIGNhbGxcbiAgICAvLyBhbmQgcmV0dXJuIGZhbHNlIHRvIHJhdGUgbGltaXQgc3RyZWFtLlxuICAgIGlmIChlLm1lc3NhZ2UgPT09XG4gICAgICAnaW52YWxpZCBzdGF0ZTogcmVhZGVyIGlzIGJ1c3kgd2l0aCBhbm90aGVyIG5leHRSb3dzIGNhbGwnKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIGUpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE9yYWNsZVF1ZXJ5U3RyZWFtXG4iXX0=