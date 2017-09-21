/* eslint max-len: 0 */

// Redshift Table Builder & Compiler
// -------

import inherits from 'inherits';
import SchemaCompiler_PG from '../../postgres/schema/compiler';

import { assign } from 'lodash';

function SchemaCompiler_Redshift() {
  SchemaCompiler_PG.apply(this, arguments);
}
inherits(SchemaCompiler_Redshift, SchemaCompiler_PG);

assign(SchemaCompiler_Redshift.prototype, {

  // dropTableIfExists(tableName) {
  //   // Nota bene: Redshift actually supports 'IF EXISTS', but the
  //   // docker container used for integrations tests does not.
  //   let sql = 'case when (select 1 from information_schema.tables where table_name = ?';
  //   const bindings = [tableName];
  //   if (this.schema) {
  //     sql += ' and table_schema = ?';
  //     bindings.push(this.schema);
  //   } else {
  //     sql += ' and table_schema = current_schema()';
  //   }
  //   sql += ') then drop table ?;';
  //   bindings.push(tableName);
  //   this.pushQuery({
  //     sql,
  //     bindings,
  //     output(resp) {
  //       return resp.rows.length > 0;
  //     }
  //   });
  // },

  // Check whether the current table
  hasTable(tableName) {
    let sql = 'select * from information_schema.tables where table_name = ?';
    const bindings = [tableName];
    if (this.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.schema);
    } else {
      sql += ' and table_schema = current_schema()';
    }
    this.pushQuery({
      sql,
      bindings,
      output(resp) {
        return resp.rows.length > 0;
      }
    });
  },
});

export default SchemaCompiler_Redshift;
