// Use this shim module rather than "bluebird/js/main/promise"
// when bundling for client
'use strict';

exports.__esModule = true;

exports['default'] = function () {
  return require('bluebird');
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2JsdWViaXJkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztxQkFFZTtTQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUM7Q0FBQSIsImZpbGUiOiJibHVlYmlyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFVzZSB0aGlzIHNoaW0gbW9kdWxlIHJhdGhlciB0aGFuIFwiYmx1ZWJpcmQvanMvbWFpbi9wcm9taXNlXCJcbi8vIHdoZW4gYnVuZGxpbmcgZm9yIGNsaWVudFxuZXhwb3J0IGRlZmF1bHQgKCkgPT4gcmVxdWlyZSgnYmx1ZWJpcmQnKVxuIl19