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

var debugTx = require('debug')('knex:tx');

function Oracle_Transaction(client, container, config, outerTx) {
  _transaction2['default'].call(this, client, container, config, outerTx);
}
_inherits2['default'](Oracle_Transaction, _transaction2['default']);

_lodash.assign(Oracle_Transaction.prototype, {

  // disable autocommit to allow correct behavior (default is true)
  begin: function begin() {
    return _promise2['default'].resolve();
  },

  commit: function commit(conn, value) {
    this._completed = true;
    return conn.commitAsync()['return'](value).then(this._resolver, this._rejecter);
  },

  release: function release(conn, value) {
    return this._resolver(value);
  },

  rollback: function rollback(conn, err) {
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn.rollbackAsync()['throw'](err)['catch'](this._rejecter);
  },

  acquireConnection: function acquireConnection(config) {
    var t = this;
    return _promise2['default']['try'](function () {
      return config.connection || t.client.acquireConnection().completed;
    }).tap(function (connection) {
      if (!t.outerTx) {
        connection.setAutoCommit(false);
      }
    }).disposer(function (connection) {
      debugTx('%s: releasing connection', t.txid);
      connection.setAutoCommit(true);
      if (!config.connection) {
        t.client.releaseConnection(connection);
      } else {
        debugTx('%s: not releasing external connection', t.txid);
      }
    });
  }

});

exports['default'] = Oracle_Transaction;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9vcmFjbGUvdHJhbnNhY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3dCQUNxQixVQUFVOzs7O3VCQUNYLGVBQWU7Ozs7MkJBQ1gsbUJBQW1COzs7O3NCQUdwQixRQUFROztBQUYvQixJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7O0FBSTNDLFNBQVMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQzlELDJCQUFZLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7Q0FDM0Q7QUFDRCxzQkFBUyxrQkFBa0IsMkJBQWMsQ0FBQTs7QUFFekMsZUFBTyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUU7OztBQUduQyxPQUFLLEVBQUEsaUJBQUc7QUFDTixXQUFPLHFCQUFRLE9BQU8sRUFBRSxDQUFBO0dBQ3pCOztBQUVELFFBQU0sRUFBQSxnQkFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xCLFFBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFBO0FBQ3RCLFdBQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUNoQixDQUFDLEtBQUssQ0FBQyxDQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtHQUN4Qzs7QUFFRCxTQUFPLEVBQUEsaUJBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNuQixXQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7R0FDN0I7O0FBRUQsVUFBUSxFQUFBLGtCQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDbEIsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7QUFDdEIsV0FBTyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUN0QyxXQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsU0FDbkIsQ0FBQyxHQUFHLENBQUMsU0FDTCxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtHQUN6Qjs7QUFFRCxtQkFBaUIsRUFBQSwyQkFBQyxNQUFNLEVBQUU7QUFDeEIsUUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFBO0FBQ2QsV0FBTywyQkFBVyxDQUFDO2FBQ2pCLE1BQU0sQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLFNBQVM7S0FBQSxDQUM1RCxDQUFDLEdBQUcsQ0FBQyxVQUFBLFVBQVUsRUFBSTtBQUNsQixVQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRTtBQUNkLGtCQUFVLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO09BQ2hDO0tBQ0YsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFBLFVBQVUsRUFBSTtBQUN4QixhQUFPLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQzNDLGdCQUFVLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQzlCLFVBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO0FBQ3RCLFNBQUMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUE7T0FDdkMsTUFBTTtBQUNMLGVBQU8sQ0FBQyx1Q0FBdUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7T0FDekQ7S0FDRixDQUFDLENBQUE7R0FDSDs7Q0FFRixDQUFDLENBQUE7O3FCQUVhLGtCQUFrQiIsImZpbGUiOiJ0cmFuc2FjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCBQcm9taXNlIGZyb20gJy4uLy4uL3Byb21pc2UnO1xuaW1wb3J0IFRyYW5zYWN0aW9uIGZyb20gJy4uLy4uL3RyYW5zYWN0aW9uJztcbmNvbnN0IGRlYnVnVHggPSByZXF1aXJlKCdkZWJ1ZycpKCdrbmV4OnR4JylcblxuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBPcmFjbGVfVHJhbnNhY3Rpb24oY2xpZW50LCBjb250YWluZXIsIGNvbmZpZywgb3V0ZXJUeCkge1xuICBUcmFuc2FjdGlvbi5jYWxsKHRoaXMsIGNsaWVudCwgY29udGFpbmVyLCBjb25maWcsIG91dGVyVHgpXG59XG5pbmhlcml0cyhPcmFjbGVfVHJhbnNhY3Rpb24sIFRyYW5zYWN0aW9uKVxuXG5hc3NpZ24oT3JhY2xlX1RyYW5zYWN0aW9uLnByb3RvdHlwZSwge1xuXG4gIC8vIGRpc2FibGUgYXV0b2NvbW1pdCB0byBhbGxvdyBjb3JyZWN0IGJlaGF2aW9yIChkZWZhdWx0IGlzIHRydWUpXG4gIGJlZ2luKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICB9LFxuXG4gIGNvbW1pdChjb25uLCB2YWx1ZSkge1xuICAgIHRoaXMuX2NvbXBsZXRlZCA9IHRydWVcbiAgICByZXR1cm4gY29ubi5jb21taXRBc3luYygpXG4gICAgICAucmV0dXJuKHZhbHVlKVxuICAgICAgLnRoZW4odGhpcy5fcmVzb2x2ZXIsIHRoaXMuX3JlamVjdGVyKVxuICB9LFxuXG4gIHJlbGVhc2UoY29ubiwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVzb2x2ZXIodmFsdWUpXG4gIH0sXG5cbiAgcm9sbGJhY2soY29ubiwgZXJyKSB7XG4gICAgdGhpcy5fY29tcGxldGVkID0gdHJ1ZVxuICAgIGRlYnVnVHgoJyVzOiByb2xsaW5nIGJhY2snLCB0aGlzLnR4aWQpXG4gICAgcmV0dXJuIGNvbm4ucm9sbGJhY2tBc3luYygpXG4gICAgICAudGhyb3coZXJyKVxuICAgICAgLmNhdGNoKHRoaXMuX3JlamVjdGVyKVxuICB9LFxuXG4gIGFjcXVpcmVDb25uZWN0aW9uKGNvbmZpZykge1xuICAgIGNvbnN0IHQgPSB0aGlzXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+XG4gICAgICBjb25maWcuY29ubmVjdGlvbiB8fCB0LmNsaWVudC5hY3F1aXJlQ29ubmVjdGlvbigpLmNvbXBsZXRlZFxuICAgICkudGFwKGNvbm5lY3Rpb24gPT4ge1xuICAgICAgaWYgKCF0Lm91dGVyVHgpIHtcbiAgICAgICAgY29ubmVjdGlvbi5zZXRBdXRvQ29tbWl0KGZhbHNlKVxuICAgICAgfVxuICAgIH0pLmRpc3Bvc2VyKGNvbm5lY3Rpb24gPT4ge1xuICAgICAgZGVidWdUeCgnJXM6IHJlbGVhc2luZyBjb25uZWN0aW9uJywgdC50eGlkKVxuICAgICAgY29ubmVjdGlvbi5zZXRBdXRvQ29tbWl0KHRydWUpXG4gICAgICBpZiAoIWNvbmZpZy5jb25uZWN0aW9uKSB7XG4gICAgICAgIHQuY2xpZW50LnJlbGVhc2VDb25uZWN0aW9uKGNvbm5lY3Rpb24pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWJ1Z1R4KCclczogbm90IHJlbGVhc2luZyBleHRlcm5hbCBjb25uZWN0aW9uJywgdC50eGlkKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgT3JhY2xlX1RyYW5zYWN0aW9uXG4iXX0=