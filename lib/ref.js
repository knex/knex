'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Ref = function (_Raw) {
  (0, _inherits3.default)(Ref, _Raw);

  function Ref(client, ref) {
    (0, _classCallCheck3.default)(this, Ref);

    var _this = (0, _possibleConstructorReturn3.default)(this, _Raw.call(this, client));

    _this.ref = ref;
    _this._schema = null;
    _this._alias = null;
    return _this;
  }

  Ref.prototype.withSchema = function withSchema(schema) {
    this._schema = schema;

    return this;
  };

  Ref.prototype.as = function as(alias) {
    this._alias = alias;

    return this;
  };

  Ref.prototype.toSQL = function toSQL() {
    var _Raw$prototype$toSQL;

    var string = this._schema ? this._schema + '.' + this.ref : this.ref;

    var formatter = this.client.formatter(this);

    var ref = formatter.columnize(string);

    var sql = this._alias ? ref + ' as ' + formatter.wrap(this._alias) : ref;

    this.set(sql, []);

    return (_Raw$prototype$toSQL = _Raw.prototype.toSQL).call.apply(_Raw$prototype$toSQL, [this].concat(Array.prototype.slice.call(arguments)));
  };

  return Ref;
}(_raw2.default);

exports.default = Ref;
module.exports = exports['default'];