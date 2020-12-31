/* eslint max-len: 0 */

// Redshift Table Builder & Compiler
// -------

const { inherits } = require('util');
const SchemaCompiler_PG = require('../../postgres/schema/compiler');

function SchemaCompiler_Redshift() {
  SchemaCompiler_PG.apply(this, arguments);
}
inherits(SchemaCompiler_Redshift, SchemaCompiler_PG);

module.exports = SchemaCompiler_Redshift;
