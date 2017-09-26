"use strict";

import inherits from 'inherits';
import ColumnBuilder from '../../../schema/columnbuilder';

function ColumnBuilder_Redshift() {
  ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_Redshift, ColumnBuilder);

// primary needs to set not null on non-preexisting columns, or fail
ColumnBuilder_Redshift.prototype.primary = function () {
  this.notNullable();
  return ColumnBuilder.prototype.primary.apply(this);
};

export default ColumnBuilder_Redshift;
