/* eslint max-len: 0 */

const ViewCompiler = require('../../../schema/viewcompiler.js');

class ViewCompiler_PG extends ViewCompiler {
  constructor(client, viewCompiler) {
    super(client, viewCompiler);
  }
}

module.exports = ViewCompiler_PG;
