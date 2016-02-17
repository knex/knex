var Builder = require('../../query/builder');
var inherits = require('inherits');
var _ = require('lodash');
var BlobHelper = require('./utils').BlobHelper;

function Builder_OracleDb() {
  Builder.apply(this, arguments);
}
inherits(Builder_OracleDb, Builder);

Builder_OracleDb.prototype.insert = function insert(values, returning) {
    returning = returning || [];
    _.each(values, function(value, key) {
      if(value instanceof Buffer) {
        values[key] = new BlobHelper(key, value);
        returning.push(values[key]);
      }
    });
    
    this._method = 'insert';
    if (!_.isEmpty(returning)) {
      this.returning(returning);
    }
    this._single.insert = values;
    return this;
  };
  
module.exports = Builder_OracleDb;