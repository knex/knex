const {
  columnize: columnize_,
  wrap: wrap_,
} = require('./formatter/wrappingFormatter');

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

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter(value) {
    return this.client.parameter(value, this.builder, this);
  }

  // Puts the appropriate wrapper around a value depending on the database
  // engine, unless it's a knex.raw value, in which case it's left alone.
  wrap(value, isParameter) {
    return wrap_(value, isParameter, this.builder, this.client, this);
  }
}

module.exports = Formatter;
