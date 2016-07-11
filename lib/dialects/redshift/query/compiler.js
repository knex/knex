
// Redshift Query Builder & Compiler
// ------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _postgresQueryCompiler = require('../../postgres/query/compiler');

var _postgresQueryCompiler2 = _interopRequireDefault(_postgresQueryCompiler);

var _lodash = require('lodash');

function QueryCompiler_Redshift(client, builder) {
  _postgresQueryCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](QueryCompiler_Redshift, _postgresQueryCompiler2['default']);

_lodash.assign(QueryCompiler_Redshift.prototype, {
  _returning: function _returning(value) {
    return '';
  }
});

exports['default'] = QueryCompiler_Redshift;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9yZWRzaGlmdC9xdWVyeS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7d0JBR3FCLFVBQVU7Ozs7cUNBRUYsK0JBQStCOzs7O3NCQUVyQyxRQUFROztBQUUvQixTQUFTLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDL0MscUNBQWlCLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0NBQzlDO0FBQ0Qsc0JBQVMsc0JBQXNCLHFDQUFtQixDQUFDOztBQUVuRCxlQUFPLHNCQUFzQixDQUFDLFNBQVMsRUFBRTtBQUN2QyxZQUFVLEVBQUEsb0JBQUMsS0FBSyxFQUFFO0FBQ2hCLFdBQU8sRUFBRSxDQUFDO0dBQ1g7Q0FDRixDQUFDLENBQUE7O3FCQUVhLHNCQUFzQiIsImZpbGUiOiJjb21waWxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gUmVkc2hpZnQgUXVlcnkgQnVpbGRlciAmIENvbXBpbGVyXG4vLyAtLS0tLS1cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5cbmltcG9ydCBRdWVyeUNvbXBpbGVyX1BHIGZyb20gJy4uLy4uL3Bvc3RncmVzL3F1ZXJ5L2NvbXBpbGVyJztcblxuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBRdWVyeUNvbXBpbGVyX1JlZHNoaWZ0KGNsaWVudCwgYnVpbGRlcikge1xuICBRdWVyeUNvbXBpbGVyX1BHLmNhbGwodGhpcywgY2xpZW50LCBidWlsZGVyKTtcbn1cbmluaGVyaXRzKFF1ZXJ5Q29tcGlsZXJfUmVkc2hpZnQsIFF1ZXJ5Q29tcGlsZXJfUEcpO1xuXG5hc3NpZ24oUXVlcnlDb21waWxlcl9SZWRzaGlmdC5wcm90b3R5cGUsIHtcbiAgX3JldHVybmluZyh2YWx1ZSkge1xuICAgIHJldHVybiAnJztcbiAgfVxufSlcblxuZXhwb3J0IGRlZmF1bHQgUXVlcnlDb21waWxlcl9SZWRzaGlmdDtcbiJdfQ==