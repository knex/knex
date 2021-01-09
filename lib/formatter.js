const Raw = require('./raw');
const {
  columnize: columnize_,
  wrap: wrap_,
  unwrapRaw: unwrapRaw_,
  operator: operator_,
  outputQuery: outputQuery_,
  rawOrFn: rawOrFn_,
} = require('./formatter/wrappingFormatter');
const {
  compileCallback: compileCallback_,
} = require('./formatter/formatterUtils');

class Formatter {
  constructor(client, builder) {
    this.client = client;
    this.builder = builder;
    this.bindings = [];
  }

  // Accepts a string or array of columns to wrap as appropriate.
  columnize(target) {
    return columnize_(target, this.builder, this.client, this);
  }

  // Turns a list of values into a list of ?'s, joining them with commas unless
  // a "joining" value is specified (e.g. ' and ')
  parameterize(values, notSetValue) {
    if (typeof values === 'function')
      return this.client.parameter(values, this.builder, this);
    values = Array.isArray(values) ? values : [values];
    let str = '',
      i = -1;
    while (++i < values.length) {
      if (i > 0) str += ', ';
      str += this.client.parameter(
        values[i] === undefined ? notSetValue : values[i],
        this.builder,
        this
      );
    }
    return str;
  }

  // Formats `values` into a parenthesized list of parameters for a `VALUES`
  // clause.
  //
  // [1, 2]                  -> '(?, ?)'
  // [[1, 2], [3, 4]]        -> '((?, ?), (?, ?))'
  // knex('table')           -> '(select * from "table")'
  // knex.raw('select ?', 1) -> '(select ?)'
  //
  values(values) {
    if (Array.isArray(values)) {
      if (Array.isArray(values[0])) {
        return `(${values
          .map((value) => `(${this.parameterize(value)})`)
          .join(', ')})`;
      }
      return `(${this.parameterize(values)})`;
    }

    if (values instanceof Raw) {
      return `(${this.client.parameter(values, this.builder, this)})`;
    }

    return this.client.parameter(values, this.builder, this);
  }

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter(value) {
    return this.client.parameter(value, this.builder, this);
  }

  unwrapRaw(value, isParameter) {
    return unwrapRaw_(value, isParameter, this.builder, this.client, this);
  }

  /**
   * Creates SQL for a parameter, which might be passed to where() or .with() or
   * pretty much anywhere in API.
   *
   * @param value Callback (for where or complete builder), Raw or QueryBuilder
   * @param method Optional at least 'select' or 'update' are valid
   */
  rawOrFn(value, method) {
    return rawOrFn_(value, method, this.builder, this.client, this);
  }

  // Puts the appropriate wrapper around a value depending on the database
  // engine, unless it's a knex.raw value, in which case it's left alone.
  wrap(value, isParameter) {
    return wrap_(value, isParameter, this.builder, this.client, this);
  }

  operator(value) {
    return operator_(value, this.builder, this.client, this);
  }
}

module.exports = Formatter;
