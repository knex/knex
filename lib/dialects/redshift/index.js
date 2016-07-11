
// Redshift Client
// -------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _postgres = require('../postgres');

var _postgres2 = _interopRequireDefault(_postgres);

var _lodash = require('lodash');

var _queryCompiler = require('./query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _schemaColumncompiler = require('./schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

function Client_Redshift(config) {
  _postgres2['default'].call(this, config);
}
_inherits2['default'](Client_Redshift, _postgres2['default']);

_lodash.assign(Client_Redshift.prototype, {
  QueryCompiler: _queryCompiler2['default'],

  ColumnCompiler: _schemaColumncompiler2['default'],

  dialect: 'redshift'
});

exports['default'] = Client_Redshift;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9yZWRzaGlmdC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7d0JBR3FCLFVBQVU7Ozs7d0JBQ1QsYUFBYTs7OztzQkFDWixRQUFROzs2QkFFTCxrQkFBa0I7Ozs7b0NBQ2pCLHlCQUF5Qjs7OztBQUVwRCxTQUFTLGVBQWUsQ0FBQyxNQUFNLEVBQUU7QUFDL0Isd0JBQVUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtDQUM3QjtBQUNELHNCQUFTLGVBQWUsd0JBQVksQ0FBQTs7QUFFcEMsZUFBTyxlQUFlLENBQUMsU0FBUyxFQUFFO0FBQ2hDLGVBQWEsNEJBQUE7O0FBRWIsZ0JBQWMsbUNBQUE7O0FBRWQsU0FBTyxFQUFFLFVBQVU7Q0FDcEIsQ0FBQyxDQUFBOztxQkFFYSxlQUFlIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBSZWRzaGlmdCBDbGllbnRcbi8vIC0tLS0tLS1cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgQ2xpZW50X1BHIGZyb20gJy4uL3Bvc3RncmVzJztcbmltcG9ydCB7IGFzc2lnbiB9IGZyb20gJ2xvZGFzaCdcblxuaW1wb3J0IFF1ZXJ5Q29tcGlsZXIgZnJvbSAnLi9xdWVyeS9jb21waWxlcic7XG5pbXBvcnQgQ29sdW1uQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xuXG5mdW5jdGlvbiBDbGllbnRfUmVkc2hpZnQoY29uZmlnKSB7XG4gIENsaWVudF9QRy5jYWxsKHRoaXMsIGNvbmZpZylcbn1cbmluaGVyaXRzKENsaWVudF9SZWRzaGlmdCwgQ2xpZW50X1BHKVxuXG5hc3NpZ24oQ2xpZW50X1JlZHNoaWZ0LnByb3RvdHlwZSwge1xuICBRdWVyeUNvbXBpbGVyLFxuXG4gIENvbHVtbkNvbXBpbGVyLFxuICBcbiAgZGlhbGVjdDogJ3JlZHNoaWZ0J1xufSlcblxuZXhwb3J0IGRlZmF1bHQgQ2xpZW50X1JlZHNoaWZ0O1xuIl19