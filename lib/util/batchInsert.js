'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _promise = require('../promise');

var _promise2 = _interopRequireDefault(_promise);

var BatchInsert = (function () {
  function BatchInsert(client, tableName, batch) {
    var chunkSize = arguments.length <= 3 || arguments[3] === undefined ? 1000 : arguments[3];

    _classCallCheck(this, BatchInsert);

    if (!_lodash.isNumber(chunkSize) || chunkSize < 1) {
      throw new TypeError('Invalid chunkSize: ' + chunkSize);
    }

    if (!_lodash.isArray(batch)) {
      throw new TypeError('Invalid batch: Expected array, got ' + typeof batch);
    }

    this.client = client;
    this.tableName = tableName;
    this.batch = _lodash.chunk(batch, chunkSize);
    this._returning = void 0;
    this._transaction = null;
    this._autoTransaction = true;

    if (client.transacting) {
      this.transacting(client);
    }
  }

  /**
   * Columns to return from the batch operation.
   * @param returning
   */

  BatchInsert.prototype.returning = function returning(_returning) {
    if (_lodash.isArray(_returning) || _lodash.isString(_returning)) {
      this._returning = _returning;
    }
    return this;
  };

  /**
   * User may supply their own transaction. If this is the case,
   * `autoTransaction = false`, meaning we don't automatically commit/rollback
   * the transaction. The responsibility instead falls on the user.
   *
   * @param transaction
   */

  BatchInsert.prototype.transacting = function transacting(transaction) {
    this._transaction = transaction;
    this._autoTransaction = false;
    return this;
  };

  BatchInsert.prototype._getTransaction = function _getTransaction() {
    var _this = this;

    return new _promise2['default'](function (resolve) {
      if (_this._transaction) {
        return resolve(_this._transaction);
      }
      _this.client.transaction(function (tr) {
        return resolve(tr);
      });
    });
  };

  BatchInsert.prototype.then = function then() {
    var _this2 = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

    return this._getTransaction().then(function (transaction) {
      return _promise2['default'].all(_this2.batch.map(function (items) {
        return transaction(_this2.tableName).insert(items, _this2._returning);
      })).then(function (result) {
        if (_this2._autoTransaction) {
          transaction.commit();
        }
        return callback(_lodash.flatten(result || []));
      })['catch'](function (error) {
        if (_this2._autoTransaction) {
          transaction.rollback(error);
        }
        throw error;
      });
    });
  };

  return BatchInsert;
})();

exports['default'] = BatchInsert;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2JhdGNoSW5zZXJ0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O3NCQUU0RCxRQUFROzt1QkFDaEQsWUFBWTs7OztJQUVYLFdBQVc7QUFDbkIsV0FEUSxXQUFXLENBQ2xCLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFvQjtRQUFsQixTQUFTLHlEQUFHLElBQUk7OzBCQURuQyxXQUFXOztBQUU1QixRQUFHLENBQUMsaUJBQVMsU0FBUyxDQUFDLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRTtBQUN4QyxZQUFNLElBQUksU0FBUyx5QkFBdUIsU0FBUyxDQUFHLENBQUM7S0FDeEQ7O0FBRUQsUUFBRyxDQUFDLGdCQUFRLEtBQUssQ0FBQyxFQUFFO0FBQ2xCLFlBQU0sSUFBSSxTQUFTLHlDQUF1QyxPQUFPLEtBQUssQ0FBRyxDQUFBO0tBQzFFOztBQUVELFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLFFBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0FBQzNCLFFBQUksQ0FBQyxLQUFLLEdBQUcsY0FBTSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDckMsUUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUN6QixRQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUN6QixRQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDOztBQUU3QixRQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUU7QUFDdEIsVUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMxQjtHQUNGOzs7Ozs7O0FBcEJrQixhQUFXLFdBMEI5QixTQUFTLEdBQUEsbUJBQUMsVUFBUyxFQUFFO0FBQ25CLFFBQUcsZ0JBQVEsVUFBUyxDQUFDLElBQUksaUJBQVMsVUFBUyxDQUFDLEVBQUU7QUFDNUMsVUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFTLENBQUM7S0FDN0I7QUFDRCxXQUFPLElBQUksQ0FBQztHQUNiOzs7Ozs7Ozs7O0FBL0JrQixhQUFXLFdBd0M5QixXQUFXLEdBQUEscUJBQUMsV0FBVyxFQUFFO0FBQ3ZCLFFBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO0FBQ2hDLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7QUFDOUIsV0FBTyxJQUFJLENBQUM7R0FDYjs7QUE1Q2tCLGFBQVcsV0E4QzlCLGVBQWUsR0FBQSwyQkFBRzs7O0FBQ2hCLFdBQU8seUJBQVksVUFBQyxPQUFPLEVBQUs7QUFDOUIsVUFBRyxNQUFLLFlBQVksRUFBRTtBQUNwQixlQUFPLE9BQU8sQ0FBQyxNQUFLLFlBQVksQ0FBQyxDQUFDO09BQ25DO0FBQ0QsWUFBSyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQUMsRUFBRTtlQUFLLE9BQU8sQ0FBQyxFQUFFLENBQUM7T0FBQSxDQUFDLENBQUM7S0FDOUMsQ0FBQyxDQUFDO0dBQ0o7O0FBckRrQixhQUFXLFdBdUQ5QixJQUFJLEdBQUEsZ0JBQTJCOzs7UUFBMUIsUUFBUSx5REFBRyxZQUFXLEVBQUU7O0FBQzNCLFdBQU8sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUMxQixJQUFJLENBQUMsVUFBQyxXQUFXLEVBQUs7QUFDckIsYUFBTyxxQkFBUSxHQUFHLENBQUMsT0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBSyxFQUFLO0FBQzNDLGVBQU8sV0FBVyxDQUFDLE9BQUssU0FBUyxDQUFDLENBQy9CLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBSyxVQUFVLENBQUMsQ0FBQztPQUNuQyxDQUFDLENBQUMsQ0FDQSxJQUFJLENBQUMsVUFBQyxNQUFNLEVBQUs7QUFDaEIsWUFBRyxPQUFLLGdCQUFnQixFQUFFO0FBQ3hCLHFCQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDdEI7QUFDRCxlQUFPLFFBQVEsQ0FBQyxnQkFBUSxNQUFNLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztPQUN4QyxDQUFDLFNBQ0ksQ0FBQyxVQUFDLEtBQUssRUFBSztBQUNoQixZQUFHLE9BQUssZ0JBQWdCLEVBQUU7QUFDeEIscUJBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDN0I7QUFDRCxjQUFNLEtBQUssQ0FBQztPQUNiLENBQUMsQ0FBQztLQUNOLENBQUMsQ0FBQztHQUNOOztTQTNFa0IsV0FBVzs7O3FCQUFYLFdBQVciLCJmaWxlIjoiYmF0Y2hJbnNlcnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuXHJcbmltcG9ydCB7IGlzTnVtYmVyLCBpc1N0cmluZywgaXNBcnJheSwgY2h1bmssIGZsYXR0ZW4gfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgUHJvbWlzZSBmcm9tICcuLi9wcm9taXNlJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJhdGNoSW5zZXJ0IHtcclxuICBjb25zdHJ1Y3RvcihjbGllbnQsIHRhYmxlTmFtZSwgYmF0Y2gsIGNodW5rU2l6ZSA9IDEwMDApIHtcclxuICAgIGlmKCFpc051bWJlcihjaHVua1NpemUpIHx8IGNodW5rU2l6ZSA8IDEpIHtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW52YWxpZCBjaHVua1NpemU6ICR7Y2h1bmtTaXplfWApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCFpc0FycmF5KGJhdGNoKSkge1xyXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIGJhdGNoOiBFeHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZW9mIGJhdGNofWApXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jbGllbnQgPSBjbGllbnQ7XHJcbiAgICB0aGlzLnRhYmxlTmFtZSA9IHRhYmxlTmFtZTtcclxuICAgIHRoaXMuYmF0Y2ggPSBjaHVuayhiYXRjaCwgY2h1bmtTaXplKTtcclxuICAgIHRoaXMuX3JldHVybmluZyA9IHZvaWQgMDtcclxuICAgIHRoaXMuX3RyYW5zYWN0aW9uID0gbnVsbDtcclxuICAgIHRoaXMuX2F1dG9UcmFuc2FjdGlvbiA9IHRydWU7XHJcblxyXG4gICAgaWYgKGNsaWVudC50cmFuc2FjdGluZykge1xyXG4gICAgICB0aGlzLnRyYW5zYWN0aW5nKGNsaWVudCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb2x1bW5zIHRvIHJldHVybiBmcm9tIHRoZSBiYXRjaCBvcGVyYXRpb24uXHJcbiAgICogQHBhcmFtIHJldHVybmluZ1xyXG4gICAqL1xyXG4gIHJldHVybmluZyhyZXR1cm5pbmcpIHtcclxuICAgIGlmKGlzQXJyYXkocmV0dXJuaW5nKSB8fCBpc1N0cmluZyhyZXR1cm5pbmcpKSB7XHJcbiAgICAgIHRoaXMuX3JldHVybmluZyA9IHJldHVybmluZztcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlciBtYXkgc3VwcGx5IHRoZWlyIG93biB0cmFuc2FjdGlvbi4gSWYgdGhpcyBpcyB0aGUgY2FzZSxcclxuICAgKiBgYXV0b1RyYW5zYWN0aW9uID0gZmFsc2VgLCBtZWFuaW5nIHdlIGRvbid0IGF1dG9tYXRpY2FsbHkgY29tbWl0L3JvbGxiYWNrXHJcbiAgICogdGhlIHRyYW5zYWN0aW9uLiBUaGUgcmVzcG9uc2liaWxpdHkgaW5zdGVhZCBmYWxscyBvbiB0aGUgdXNlci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB0cmFuc2FjdGlvblxyXG4gICAqL1xyXG4gIHRyYW5zYWN0aW5nKHRyYW5zYWN0aW9uKSB7XHJcbiAgICB0aGlzLl90cmFuc2FjdGlvbiA9IHRyYW5zYWN0aW9uO1xyXG4gICAgdGhpcy5fYXV0b1RyYW5zYWN0aW9uID0gZmFsc2U7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIF9nZXRUcmFuc2FjdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICBpZih0aGlzLl90cmFuc2FjdGlvbikge1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKHRoaXMuX3RyYW5zYWN0aW9uKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmNsaWVudC50cmFuc2FjdGlvbigodHIpID0+IHJlc29sdmUodHIpKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdGhlbihjYWxsYmFjayA9IGZ1bmN0aW9uKCkge30pIHtcclxuICAgIHJldHVybiB0aGlzLl9nZXRUcmFuc2FjdGlvbigpXHJcbiAgICAgIC50aGVuKCh0cmFuc2FjdGlvbikgPT4ge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmJhdGNoLm1hcCgoaXRlbXMpID0+IHtcclxuICAgICAgICAgIHJldHVybiB0cmFuc2FjdGlvbih0aGlzLnRhYmxlTmFtZSlcclxuICAgICAgICAgICAgLmluc2VydChpdGVtcywgdGhpcy5fcmV0dXJuaW5nKTtcclxuICAgICAgICB9KSlcclxuICAgICAgICAgIC50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgaWYodGhpcy5fYXV0b1RyYW5zYWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgdHJhbnNhY3Rpb24uY29tbWl0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGZsYXR0ZW4ocmVzdWx0IHx8IFtdKSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICBpZih0aGlzLl9hdXRvVHJhbnNhY3Rpb24pIHtcclxuICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5yb2xsYmFjayhlcnJvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==