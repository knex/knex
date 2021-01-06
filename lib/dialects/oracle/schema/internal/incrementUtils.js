const Trigger = require('./trigger');

// helper function for pushAdditional in increments() and bigincrements()
function createAutoIncrementTriggerAndSequence(columnCompiler) {
  // TODO Add warning that sequence etc is created
  columnCompiler.pushAdditional(function () {
    const tableName = columnCompiler.tableCompiler.tableNameRaw;
    const createTriggerSQL = Trigger.createAutoIncrementTrigger(
      columnCompiler.client.logger,
      tableName
    );
    columnCompiler.pushQuery(createTriggerSQL);
  });
}

module.exports = {
  createAutoIncrementTriggerAndSequence,
};
