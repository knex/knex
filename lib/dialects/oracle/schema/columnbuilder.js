const inherits = require('inherits');
const ColumnBuilder = require('../../../schema/columnbuilder');

const toArray = require('lodash/toArray');

function ColumnBuilder_Oracle() {
  ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_Oracle, ColumnBuilder);

// checkIn added to the builder to allow the column compiler to change the
// order via the modifiers ("check" must be after "default")
ColumnBuilder_Oracle.prototype.checkIn = function () {
  this._modifiers.checkIn = toArray(arguments);
  return this;
};

module.exports = ColumnBuilder_Oracle;
