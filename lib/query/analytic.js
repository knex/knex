const assert = require('assert');
const { isObject } = require('../util/is');

// Analytic
// -------

// The "Analytic" is an object holding any necessary info about a analytic function
// e.g row_number, rank, dense_rank,
class Analytic {
  constructor(method, schema, alias, orderBy, partitions) {
    this.schema = schema;
    this.type = 'analytic';
    this.method = method;
    this.order = orderBy || [];
    this.partitions = partitions || [];
    this.alias = alias;
    this.and = this;

    this.grouping = 'columns';
  }

  partitionBy(column) {
    assert(
      Array.isArray(column) || typeof column === 'string',
      `The argument to an analytic partitionBy function must be either a string
            or an array of string.`
    );

    if (Array.isArray(column)) {
      this.partitions = this.partitions.concat(column);
    } else {
      this.partitions.push(column);
    }
    return this;
  }

  orderBy(column, direction) {
    assert(
      Array.isArray(column) || typeof column === 'string',
      `The argument to an analytic orderBy function must be either a string
            or an array of string.`
    );

    if (Array.isArray(column)) {
      this.order = this.order.concat(this._orderByArray(column));
    } else {
      this.order.push(column + (direction ? " " + direction : ""));
    }
    return this;
  }
  
  _orderByArray(columnDefs){
    return columnDefs.map(c => isObject(c) ? c.column + (c.order ? " " + c.order : "") : c).join(", ");
  }
}

module.exports = Analytic;
