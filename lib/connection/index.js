'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _events = require('events');

var Connection = (function (_EventEmitter) {
  _inherits(Connection, _EventEmitter);

  function Connection(connection) {
    _classCallCheck(this, Connection);

    _EventEmitter.call(this);
    this.connection = connection;

    // Flag indicating whether the connection is "managed",
    // and should be released to the pool upon completion
    this.managed = false;
  }

  Connection.prototype.execute = function execute() {
    return this._execute();
  };

  return Connection;
})(_events.EventEmitter);

exports['default'] = Connection;
module.exports = exports['default'];