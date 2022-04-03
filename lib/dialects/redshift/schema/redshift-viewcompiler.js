/* eslint max-len: 0 */

const ViewCompiler_PG = require('../../postgres/schema/pg-viewcompiler.js');

class ViewCompiler_Redshift extends ViewCompiler_PG {
  constructor(client, viewCompiler) {
    super(client, viewCompiler);
  }
}

module.exports = ViewCompiler_Redshift;
