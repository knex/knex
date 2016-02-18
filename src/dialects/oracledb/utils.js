var Utils = require('../oracle/utils');

function BlobHelper(columnName, value) {
  this.columnName = columnName;
  this.value = value;
}

BlobHelper.prototype.toString = function() {
  return '[object BlobHelper:' + this.columnName + ']';
};

Utils.BlobHelper = BlobHelper;
module.exports = Utils;