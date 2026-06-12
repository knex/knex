const Formatter = require('../../formatter');

class MSSQL_Formatter extends Formatter {
  // Accepts a string or array of columns to wrap as appropriate.
  columnizeWithPrefix(prefix, target) {
    const columns = typeof target === 'string' ? [target] : target;
    let str = '',
      i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', ';
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  }

  /**
   * Returns its argument with single quotes escaped, so it can be included into a single-quoted string.
   *
   * For example, it converts "has'quote" to "has''quote".
   *
   * This assumes QUOTED_IDENTIFIER ON so it is only ' that need escaping,
   * never ", because " cannot be used to quote a string when that's on;
   * otherwise we'd need to be aware of whether the string is quoted with " or '.
   *
   * This assumption is consistent with the SQL Knex generates.
   * @param {string} string
   * @returns {string}
   */
  escapingStringDelimiters(string) {
    return (string || '').replace(/'/g, "''");
  }
}

module.exports = MSSQL_Formatter;
