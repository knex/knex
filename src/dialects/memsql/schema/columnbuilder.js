
import inherits from 'inherits';
import ColumnBuilder from '../../../schema/columnbuilder';

function ColumnBuilder_MemSQL() {
  ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_MemSQL, ColumnBuilder);

// computed properties
ColumnBuilder_MemSQL.prototype.computed = function (definition) {
  this._modifiers.computed = definition;
  return this;
};

export default ColumnBuilder_MemSQL
