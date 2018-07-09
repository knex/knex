export * from '../oracle/utils';

export function BlobHelper(columnName, value) {
  this.columnName = columnName;
  this.value = value;
  this.returning = false;
}

BlobHelper.prototype.toString = function() {
  return '[object BlobHelper:' + this.columnName + ']';
};
