
var inherits      = require('inherits');
var ColumnBuilder = require('../../../schema/columnbuilder');

import {toArray} from 'lodash'

function ColumnBuilder_Sqlanywhere() {
  ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_Sqlanywhere, ColumnBuilder);

// checkIn added to the builder to allow the column compiler to change the
// order via the modifiers ("check" must be after "default")
ColumnBuilder_Sqlanywhere.prototype.checkIn = function () {
  this._modifiers.checkIn = toArray(arguments);
  return this;
};

module.exports = ColumnBuilder_Sqlanywhere
