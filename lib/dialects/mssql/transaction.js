'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _promise = require('../../promise');

var _promise2 = _interopRequireDefault(_promise);

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _lodash = require('lodash');

var debug = require('debug')('knex:tx');

function Transaction_MSSQL() {
  _transaction2['default'].apply(this, arguments);
}
_inherits2['default'](Transaction_MSSQL, _transaction2['default']);

_lodash.assign(Transaction_MSSQL.prototype, {

  begin: function begin(conn) {
    debug('%s: begin', this.txid);
    return conn.tx_.begin().then(this._resolver, this._rejecter);
  },

  savepoint: function savepoint(conn) {
    var _this = this;

    debug('%s: savepoint at', this.txid);
    return _promise2['default'].resolve().then(function () {
      return _this.query(conn, 'SAVE TRANSACTION ' + _this.txid);
    });
  },

  commit: function commit(conn, value) {
    var _this2 = this;

    this._completed = true;
    debug('%s: commit', this.txid);
    return conn.tx_.commit().then(function () {
      return _this2._resolver(value);
    }, this._rejecter);
  },

  release: function release(conn, value) {
    return this._resolver(value);
  },

  rollback: function rollback(conn, error) {
    var _this3 = this;

    this._completed = true;
    debug('%s: rolling back', this.txid);
    return conn.tx_.rollback().then(function () {
      return _this3._rejecter(error);
    });
  },

  rollbackTo: function rollbackTo(conn, error) {
    var _this4 = this;

    debug('%s: rolling backTo', this.txid);
    return _promise2['default'].resolve().then(function () {
      return _this4.query(conn, 'ROLLBACK TRANSACTION ' + _this4.txid, 2, error);
    }).then(function () {
      return _this4._rejecter(error);
    });
  },

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  acquireConnection: function acquireConnection(config) {
    var t = this;
    var configConnection = config && config.connection;
    return _promise2['default']['try'](function () {
      return (t.outerTx ? t.outerTx.conn : null) || configConnection || t.client.acquireConnection().completed;
    }).tap(function (conn) {
      if (!t.outerTx) {
        t.conn = conn;
        conn.tx_ = conn.transaction();
      }
    }).disposer(function (conn) {
      if (t.outerTx) return;
      if (conn.tx_) {
        if (!t._completed) {
          debug('%s: unreleased transaction', t.txid);
          conn.tx_.rollback();
        }
        conn.tx_ = null;
      }
      t.conn = null;
      if (!configConnection) {
        debug('%s: releasing connection', t.txid);
        t.client.releaseConnection(conn);
      } else {
        debug('%s: not releasing external connection', t.txid);
      }
    });
  }

});

exports['default'] = Transaction_MSSQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9tc3NxbC90cmFuc2FjdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7d0JBQ3FCLFVBQVU7Ozs7dUJBQ1gsZUFBZTs7OzsyQkFDWCxtQkFBbUI7Ozs7c0JBR3BCLFFBQVE7O0FBRi9CLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQTs7QUFJekMsU0FBUyxpQkFBaUIsR0FBRztBQUMzQiwyQkFBWSxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0NBQ25DO0FBQ0Qsc0JBQVMsaUJBQWlCLDJCQUFjLENBQUE7O0FBRXhDLGVBQU8saUJBQWlCLENBQUMsU0FBUyxFQUFFOztBQUVsQyxPQUFLLEVBQUEsZUFBQyxJQUFJLEVBQUU7QUFDVixTQUFLLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUM3QixXQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtHQUN4Qzs7QUFFRCxXQUFTLEVBQUEsbUJBQUMsSUFBSSxFQUFFOzs7QUFDZCxTQUFLLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ3BDLFdBQU8scUJBQVEsT0FBTyxFQUFFLENBQ3JCLElBQUksQ0FBQzthQUFNLE1BQUssS0FBSyxDQUFDLElBQUksd0JBQXNCLE1BQUssSUFBSSxDQUFHO0tBQUEsQ0FBQyxDQUFBO0dBQ2pFOztBQUVELFFBQU0sRUFBQSxnQkFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFOzs7QUFDbEIsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7QUFDdEIsU0FBSyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDOUIsV0FBTyxJQUFJLENBQUMsR0FB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cnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnLi4vLi4vcHJvbWlzZSc7XG5pbXBvcnQgVHJhbnNhY3Rpb24gZnJvbSAnLi4vLi4vdHJhbnNhY3Rpb24nO1xuY29uc3QgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdrbmV4OnR4JylcblxuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBUcmFuc2FjdGlvbl9NU1NRTCgpIHtcbiAgVHJhbnNhY3Rpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuaW5oZXJpdHMoVHJhbnNhY3Rpb25fTVNTUUwsIFRyYW5zYWN0aW9uKVxuXG5hc3NpZ24oVHJhbnNhY3Rpb25fTVNTUUwucHJvdG90eXBlLCB7XG5cbiAgYmVnaW4oY29ubikge1xuICAgIGRlYnVnKCclczogYmVnaW4nLCB0aGlzLnR4aWQpXG4gICAgcmV0dXJuIGNvbm4udHhfLmJlZ2luKClcbiAgICAgIC50aGVuKHRoaXMuX3Jlc29sdmVyLCB0aGlzLl9yZWplY3RlcilcbiAgfSxcblxuICBzYXZlcG9pbnQoY29ubikge1xuICAgIGRlYnVnKCclczogc2F2ZXBvaW50IGF0JywgdGhpcy50eGlkKVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5xdWVyeShjb25uLCBgU0FWRSBUUkFOU0FDVElPTiAke3RoaXMudHhpZH1gKSlcbiAgfSxcblxuICBjb21taXQoY29ubiwgdmFsdWUpIHtcbiAgICB0aGlzLl9jb21wbGV0ZWQgPSB0cnVlXG4gICAgZGVidWcoJyVzOiBjb21taXQnLCB0aGlzLnR4aWQpXG4gICAgcmV0dXJuIGNvbm4udHhfLmNvbW1pdCgpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLl9yZXNvbHZlcih2YWx1ZSksIHRoaXMuX3JlamVjdGVyKVxuICB9LFxuXG4gIHJlbGVhc2UoY29ubiwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVzb2x2ZXIodmFsdWUpXG4gIH0sXG5cbiAgcm9sbGJhY2soY29ubiwgZXJyb3IpIHtcbiAgICB0aGlzLl9jb21wbGV0ZWQgPSB0cnVlXG4gICAgZGVidWcoJyVzOiByb2xsaW5nIGJhY2snLCB0aGlzLnR4aWQpXG4gICAgcmV0dXJuIGNvbm4udHhfLnJvbGxiYWNrKClcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuX3JlamVjdGVyKGVycm9yKSlcbiAgfSxcblxuICByb2xsYmFja1RvKGNvbm4sIGVycm9yKSB7XG4gICAgZGVidWcoJyVzOiByb2xsaW5nIGJhY2tUbycsIHRoaXMudHhpZClcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIC50aGVuKCgpID0+IHRoaXMucXVlcnkoY29ubiwgYFJPTExCQUNLIFRSQU5TQUNUSU9OICR7dGhpcy50eGlkfWAsIDIsIGVycm9yKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuX3JlamVjdGVyKGVycm9yKSlcbiAgfSxcblxuICAvLyBBY3F1aXJlIGEgY29ubmVjdGlvbiBhbmQgY3JlYXRlIGEgZGlzcG9zZXIgLSBlaXRoZXIgdXNpbmcgdGhlIG9uZSBwYXNzZWRcbiAgLy8gdmlhIGNvbmZpZyBvciBnZXR0aW5nIG9uZSBvZmYgdGhlIGNsaWVudC4gVGhlIGRpc3Bvc2VyIHdpbGwgYmUgY2FsbGVkIG9uY2VcbiAgLy8gdGhlIG9yaWdpbmFsIHByb21pc2UgaXMgbWFya2VkIGNvbXBsZXRlZC5cbiAgYWNxdWlyZUNvbm5lY3Rpb24oY29uZmlnKSB7XG4gICAgY29uc3QgdCA9IHRoaXNcbiAgICBjb25zdCBjb25maWdDb25uZWN0aW9uID0gY29uZmlnICYmIGNvbmZpZy5jb25uZWN0aW9uXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcbiAgICAgIHJldHVybiAodC5vdXRlclR4ID8gdC5vdXRlclR4LmNvbm4gOiBudWxsKSB8fFxuICAgICAgICBjb25maWdDb25uZWN0aW9uIHx8XG4gICAgICAgIHQuY2xpZW50LmFjcXVpcmVDb25uZWN0aW9uKCkuY29tcGxldGVkO1xuICAgIH0pLnRhcChmdW5jdGlvbihjb25uKSB7XG4gICAgICBpZiAoIXQub3V0ZXJUeCkge1xuICAgICAgICB0LmNvbm4gPSBjb25uXG4gICAgICAgIGNvbm4udHhfID0gY29ubi50cmFuc2FjdGlvbigpXG4gICAgICB9XG4gICAgfSkuZGlzcG9zZXIoZnVuY3Rpb24oY29ubikge1xuICAgICAgaWYgKHQub3V0ZXJUeCkgcmV0dXJuO1xuICAgICAgaWYgKGNvbm4udHhfKSB7XG4gICAgICAgIGlmICghdC5fY29tcGxldGVkKSB7XG4gICAgICAgICAgZGVidWcoJyVzOiB1bnJlbGVhc2VkIHRyYW5zYWN0aW9uJywgdC50eGlkKVxuICAgICAgICAgIGNvbm4udHhfLnJvbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29ubi50eF8gPSBudWxsO1xuICAgICAgfVxuICAgICAgdC5jb25uID0gbnVsbFxuICAgICAgaWYgKCFjb25maWdDb25uZWN0aW9uKSB7XG4gICAgICAgIGRlYnVnKCclczogcmVsZWFzaW5nIGNvbm5lY3Rpb24nLCB0LnR4aWQpXG4gICAgICAgIHQuY2xpZW50LnJlbGVhc2VDb25uZWN0aW9uKGNvbm4pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWJ1ZygnJXM6IG5vdCByZWxlYXNpbmcgZXh0ZXJuYWwgY29ubmVjdGlvbicsIHQudHhpZClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IFRyYW5zYWN0aW9uX01TU1FMXG4iXX0=