'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _formatter = require('../../formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _lodash = require('lodash');

function MSSQL_Formatter(client) {
  _formatter2['default'].call(this, client);
}
_inherits2['default'](MSSQL_Formatter, _formatter2['default']);

_lodash.assign(MSSQL_Formatter.prototype, {

  // Accepts a string or array of columns to wrap as appropriate.
  columnizeWithPrefix: function columnizeWithPrefix(prefix, target) {
    var columns = typeof target === 'string' ? [target] : target;
    var str = '',
        i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', ';
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  }

});

exports['default'] = MSSQL_Formatter;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9tc3NxbC9mb3JtYXR0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3dCQUNxQixVQUFVOzs7O3lCQUNULGlCQUFpQjs7OztzQkFFaEIsUUFBUTs7QUFFL0IsU0FBUyxlQUFlLENBQUMsTUFBTSxFQUFFO0FBQy9CLHlCQUFVLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7Q0FDN0I7QUFDRCxzQkFBUyxlQUFlLHlCQUFZLENBQUE7O0FBRXBDLGVBQU8sZUFBZSxDQUFDLFNBQVMsRUFBRTs7O0FBR2hDLHFCQUFtQixFQUFBLDZCQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUU7QUFDbEMsUUFBTSxPQUFPLEdBQUcsT0FBTyxNQUFNLEtBQUssUUFBUSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFBO0FBQzlELFFBQUksR0FBRyxHQUFHLEVBQUU7UUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDckIsV0FBTyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQzNCLFVBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksSUFBSSxDQUFBO0FBQ3RCLFNBQUcsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUN0QztBQUNELFdBQU8sR0FBRyxDQUFBO0dBQ1g7O0NBRUYsQ0FBQyxDQUFBOztxQkFFYSxlQUFlIiwiZmlsZSI6ImZvcm1hdHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCBGb3JtYXR0ZXIgZnJvbSAnLi4vLi4vZm9ybWF0dGVyJztcblxuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBNU1NRTF9Gb3JtYXR0ZXIoY2xpZW50KSB7XG4gIEZvcm1hdHRlci5jYWxsKHRoaXMsIGNsaWVudClcbn1cbmluaGVyaXRzKE1TU1FMX0Zvcm1hdHRlciwgRm9ybWF0dGVyKVxuXG5hc3NpZ24oTVNTUUxfRm9ybWF0dGVyLnByb3RvdHlwZSwge1xuXG4gIC8vIEFjY2VwdHMgYSBzdHJpbmcgb3IgYXJyYXkgb2YgY29sdW1ucyB0byB3cmFwIGFzIGFwcHJvcHJpYXRlLlxuICBjb2x1bW5pemVXaXRoUHJlZml4KHByZWZpeCwgdGFyZ2V0KSB7XG4gICAgY29uc3QgY29sdW1ucyA9IHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnID8gW3RhcmdldF0gOiB0YXJnZXRcbiAgICBsZXQgc3RyID0gJycsIGkgPSAtMTtcbiAgICB3aGlsZSAoKytpIDwgY29sdW1ucy5sZW5ndGgpIHtcbiAgICAgIGlmIChpID4gMCkgc3RyICs9ICcsICdcbiAgICAgIHN0ciArPSBwcmVmaXggKyB0aGlzLndyYXAoY29sdW1uc1tpXSlcbiAgICB9XG4gICAgcmV0dXJuIHN0clxuICB9LFxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBNU1NRTF9Gb3JtYXR0ZXJcbiJdfQ==