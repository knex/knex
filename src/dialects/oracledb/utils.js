export * from '../oracle/utils';

export class BlobHelper {
  constructor(columnName, value) {
    this.columnName = columnName;
    this.value = value;
    this.returning = false;
  }

  toString() {
    return '[object BlobHelper:' + this.columnName + ']';
  }
}
