// MSSQL Column Compiler
// -------
import inherits from "inherits";
import ColumnCompiler from "../../../schema/columncompiler";
import Raw from '../../../raw';

import { assign, isObject } from "lodash";

function ColumnCompiler_MSSQL() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = ["nullable", "defaultTo", "first", "after", "comment"];
}
inherits(ColumnCompiler_MSSQL, ColumnCompiler);

// Types
// ------

assign(ColumnCompiler_MSSQL.prototype, {
  increments: "int identity(1,1) not null primary key",

  bigincrements: "bigint identity(1,1) not null primary key",

  bigint: "bigint",
  
  json: "VARCHAR(MAX)",

  double(precision, scale) {
    if (!precision) return "decimal(18, 4)";
    return `decimal(${this._num(precision, 8)}, ${this._num(scale, 2)})`;
  },

  floating(precision, scale) {
    if (!precision) return "decimal(18, 4)";
    return `decimal(${this._num(precision, 8)}, ${this._num(scale, 2)})`;
  },

  integer(length) {
    length = length ? `(${this._num(length, 11)})` : "";
    return `int${length}`;
  },

  mediumint: "int",

  smallint: "smallint",

  tinyint(length) {
    length = length ? `(${this._num(length, 1)})` : "";
    return `tinyint${length}`;
  },

  varchar(length) {
    return `nvarchar(${this._num(length, 255)})`;
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

  bit(length) {
    if (length > 1) {
      this.client.logger.warn("Bit field is exactly 1 bit length for MSSQL");
    }
    return "bit";
  },

  binary(length) {
    return length ? `varbinary(${this._num(length)})` : "varbinary(max)";
  },

  bool: "bit",

  // Modifiers
  // ------

  defaultTo(value) {

    if (this.tableCompiler.method === 'alter') {
      this.client.logger.warn("Altering default constraints not available for MSSQL");
      return '';
    }

    if (typeof value === 'undefined') {
      return "";
    } else if (value === null) {
      value = "null";
    } else if (value instanceof Raw) {
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
      value = JSON.stringify(value);
    } else {
      value = `'${value}'`;
    }


    // if (this.type !== "blob" && this.type.indexOf("text") === -1) {
    //   return defaultVal;
    // }
    return `DEFAULT (${value})`;
  },

  first() {
    this.client.logger.warn("Column first modifier not available for MSSQL");
    return "";
  },

  after(column) {
    this.client.logger.warn("Column after modifier not available for MSSQL");
    return "";
  },

  comment(comment) {
    if (comment && comment.length > 255) {
      this.client.logger.warn(
        "Your comment is longer than the max comment length for MSSQL"
      );
    }
    return "";
  }
});

export default ColumnCompiler_MSSQL;
