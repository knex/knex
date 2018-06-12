"use strict";

exports.__esModule = true;

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _inherits = require("inherits");

var _inherits2 = _interopRequireDefault(_inherits);

var _columncompiler = require("../../../schema/columncompiler");

var _columncompiler2 = _interopRequireDefault(_columncompiler);

var _raw = require("../../../raw");

var _raw2 = _interopRequireDefault(_raw);

var _lodash = require("lodash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// MSSQL Column Compiler
// -------
function ColumnCompiler_MSSQL() {
  _columncompiler2.default.apply(this, arguments);
  this.modifiers = ["nullable", "defaultTo", "first", "after", "comment"];
}
(0, _inherits2.default)(ColumnCompiler_MSSQL, _columncompiler2.default);

// Types
// ------

(0, _lodash.assign)(ColumnCompiler_MSSQL.prototype, {
  increments: "int identity(1,1) not null primary key",

  bigincrements: "bigint identity(1,1) not null primary key",

  bigint: "bigint",

  double: function double(precision, scale) {
    if (!precision) return "decimal(18, 4)";
    return "decimal(" + this._num(precision, 8) + ", " + this._num(scale, 2) + ")";
  },
  floating: function floating(precision, scale) {
    if (!precision) return "decimal(18, 4)";
    return "decimal(" + this._num(precision, 8) + ", " + this._num(scale, 2) + ")";
  },
  integer: function integer(length) {
    length = length ? "(" + this._num(length, 11) + ")" : "";
    return "int" + length;
  },


  mediumint: "int",

  smallint: "smallint",

  tinyint: function tinyint(length) {
    length = length ? "(" + this._num(length, 1) + ")" : "";
    return "tinyint" + length;
  },
  varchar: function varchar(length) {
    return "nvarchar(" + this._num(length, 255) + ")";
  },


  text: "nvarchar(max)",

  mediumtext: "nvarchar(max)",

  longtext: "nvarchar(max)",

  // TODO: mssql supports check constraints as of SQL Server 2008
  // so make enu here more like postgres
  enu: "nvarchar(100)",

  uuid: "uniqueidentifier",

  datetime: "datetime",

  timestamp: "datetime",

  bit: function bit(length) {
    if (length > 1) {
      this.client.logger.warn("Bit field is exactly 1 bit length for MSSQL");
    }
    return "bit";
  },
  binary: function binary(length) {
    return length ? "varbinary(" + this._num(length) + ")" : "varbinary(max)";
  },


  bool: "bit",

  // Modifiers
  // ------

  defaultTo: function defaultTo(value) {

    if (this.tableCompiler.method === 'alter') {
      this.client.logger.warn("Altering default constraints not available for MSSQL");
      return '';
    }

    if (typeof value === 'undefined') {
      return "";
    } else if (value === null) {
      value = "null";
    } else if (value instanceof _raw2.default) {
      value = value.toQuery();
    } else if (this.type === "bool") {
      switch (value) {
        case true:
        case "true":
        case 1:
          value = 1;
          break;
        default:
          value = 0;
      }
    } else if (this.type === "json" && typeof value !== 'string') {
      value = (0, _stringify2.default)(value);
    } else {
      value = "'" + value + "'";
    }

    // if (this.type !== "blob" && this.type.indexOf("text") === -1) {
    //   return defaultVal;
    // }
    return "DEFAULT (" + value + ")";
  },
  first: function first() {
    this.client.logger.warn("Column first modifier not available for MSSQL");
    return "";
  },
  after: function after(column) {
    this.client.logger.warn("Column after modifier not available for MSSQL");
    return "";
  },
  comment: function comment(_comment) {
    if (_comment && _comment.length > 255) {
      this.client.logger.warn("Your comment is longer than the max comment length for MSSQL");
    }
    return "";
  }
});

exports.default = ColumnCompiler_MSSQL;
module.exports = exports["default"];