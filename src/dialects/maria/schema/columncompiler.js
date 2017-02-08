// MariaDB Column Compiler
// -------
import inherits from 'inherits';
import ColumnCompiler_MySQL from '../../mysql/schema/columncompiler';

import { assign } from 'lodash'

function ColumnCompiler_MariaDB() {
  ColumnCompiler_MySQL.apply(this, arguments);
  this.modifiers = ['unsigned', 'nullable', 'defaultTo', 'first', 'after', 'comment', 'collate']
}

inherits(ColumnCompiler_MariaDB, ColumnCompiler_MySQL);

assign(ColumnCompiler_MariaDB.prototype, {
    // mariadb doesn't support json as of yet. 
    // see https://jira.mariadb.org/browse/MDEV-9056 for issue status.
  json () {
    return 'text';
  }
});

export default ColumnCompiler_MariaDB;