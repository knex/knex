function BlobHelper(columnName, value) {
  this.columnName = columnName;
  this.value = value;
}

BlobHelper.prototype.toString = function() {
  return '[object BlobHelper:' + this.columnName + ']';
};

module.exports = {
  BlobHelper: BlobHelper
};