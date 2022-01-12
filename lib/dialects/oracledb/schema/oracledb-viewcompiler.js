/* eslint max-len: 0 */

const ViewCompiler = require('../../../schema/viewcompiler.js');

class ViewCompiler_Oracledb extends ViewCompiler {
  constructor(client, viewCompiler) {
    super(client, viewCompiler);
  }

  createOrReplace() {
    this.createQuery(this.columns, this.selectQuery, false, true);
  }

  createMaterializedView() {
    this.createQuery(this.columns, this.selectQuery, true);
  }
}

module.exports = ViewCompiler_Oracledb;
