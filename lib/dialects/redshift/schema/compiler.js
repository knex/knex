/* eslint max-len: 0 */

// Redshift Table Builder & Compiler
// -------

const SchemaCompiler_PG = require('../../postgres/schema/pg-compiler');

class SchemaCompiler_Redshift extends SchemaCompiler_PG {
  constructor() {
    super(...arguments);
  }
}

module.exports = SchemaCompiler_Redshift;
