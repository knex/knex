const ViewCompiler_PG = require('../postgres/schema/pg-viewcompiler.js');

class ViewCompiler_CRDB extends ViewCompiler_PG {
  renameColumn(from, to) {
    throw new Error('rename column of views is not supported by this dialect.');
  }

  defaultTo(column, defaultValue) {
    throw new Error(
      'change default values of views is not supported by this dialect.'
    );
  }
}

module.exports = ViewCompiler_CRDB;
