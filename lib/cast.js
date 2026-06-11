const Raw = require('./raw');

class Cast extends Raw {
  constructor(client) {
    super();
    this.client = client;
    this.value = null;
    this.to = '';
    this.alias = '';
  }

  cast(value, to, alias) {
    this.value = value;
    this.to = to;
    this.alias = alias;
    return this;
  }

  toString() {
    return this.toQuery();
  }

  _getColType(type) {
    const columnCompiler = this.client.getColumnCompiler();
    const typeName = columnCompiler.prototype[type];
    if (typeof typeName === 'function') {
      return typeName();
    }
    return typeName;
  }

  castDouble(value, alias) {
    return this.cast(value, this._getColType('double'), alias);
  }

  castChar(value, length, alias) {
    return this.cast(value, `char(${length})`, alias);
  }

  castJson(value, alias) {
    return this.cast(value, 'json', alias);
  }

  castJsonb(value, alias) {
    return this.cast(value, 'jsonb', alias);
  }

  castReal(value, alias) {
    return this.cast(value, this._getColType('floating'), alias);
  }

  castInt(value, alias) {
    return this.cast(value, this._getColType('integer'), alias);
  }

  castBigint(value, alias) {
    return this.cast(value, this._getColType('biginteger'), alias);
  }

  castBinary(value, alias) {
    return this.cast(value, this._getColType('binary'), alias);
  }

  castText(value, alias) {
    return this.cast(value, this._getColType('text'), alias);
  }

  castVia(value, intermediateType, finalType, alias) {
    this.value = value;
    this.to = finalType;
    this.alias = alias;
    this.intermediateType = intermediateType;
    return this;
  }

  toSQL() {
    const { value, to, alias } = this;

    const formatter = this.client.formatter(this);

    const asAlias = alias ? ` as ${formatter.wrap(alias)}` : '';
    const paramValue = this.client.parameter(
      value,
      formatter.builder,
      formatter
    );

    let sql;
    if (this.intermediateType) {
      sql = `cast(cast(${paramValue} as ${this.intermediateType}) as ${to})${asAlias}`;
    } else {
      sql = `cast(${paramValue} as ${to})${asAlias}`;
    }

    return {
      method: 'cast',
      sql: sql,
      bindings: formatter.bindings,
    };
  }
}

// `Cast` extends `Raw`, so it already inherits `isRawInstance`, the builder
// interface (toQuery/then/stream/...) and the query-context helper from `Raw`.

module.exports = Cast;
