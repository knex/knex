const Trigger = require('./trigger');

// helper function for pushAdditional in increments() and bigincrements()
function createAutoIncrementTriggerAndSequence(columnCompiler) {
  // TODO Add warning that sequence etc is created
  columnCompiler.pushAdditional(function () {
    const tableName = this.tableCompiler.tableNameRaw;
    const schemaName = this.tableCompiler.schemaNameRaw;
    const createTriggerSQL = Trigger.createAutoIncrementTrigger(
      this.client.logger,
      tableName,
      schemaName
    );
    this.pushQuery(createTriggerSQL);
  });
}

module.exports = {
  createAutoIncrementTriggerAndSequence,
};
