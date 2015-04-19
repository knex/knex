
function finishOracleTransaction(connection, finishFunc) {
  return new Promise(function (resolver, rejecter) {
    return finishFunc.bind(connection)(function (err, result) {
      if (err) {
        return rejecter(err);
      }
      // reset AutoCommit back to default to allow recycling in pool
      connection.setAutoCommit(true);
      resolver(result);
    });
  });
}

// disable autocommit to allow correct behavior (default is true)
Runner_Oracle.prototype.beginTransaction = function() {
  return this.connection.setAutoCommit(false);
};
Runner_Oracle.prototype.commitTransaction = function() {
  return finishOracleTransaction(this.connection, this.connection.commit);
};
Runner_Oracle.prototype.rollbackTransaction = function() {
  return finishOracleTransaction(this.connection, this.connection.rollback);
};
