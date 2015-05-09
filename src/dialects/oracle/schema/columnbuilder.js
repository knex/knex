
var inherits      = require('inherits');
var ColumnBuilder = require('../../../schema/columnbuilder');
var _             = require('lodash')

function ColumnBuilder_Oracle() {
  ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_Oracle, ColumnBuilder);

// checkIn added to the builder to allow the column compiler to change the
// order via the modifiers ("check" must be after "default")
ColumnBuilder_Oracle.prototype.checkIn = function () {
  this._modifiers.checkIn = _.toArray(arguments);
  return this;
};

module.exports = ColumnBuilder_Oracle