
import inherits from 'inherits';
import Formatter from '../../formatter';

import { assign } from 'lodash'

function MSSQL_Formatter(client) {
  Formatter.call(this, client)
}
inherits(MSSQL_Formatter, Formatter)

assign(MSSQL_Formatter.prototype, {

  // Accepts a string or array of columns to wrap as appropriate.
  columnizeWithPrefix(prefix, target) {
    const columns = typeof target === 'string' ? [target] : target
    let str = '', i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', '
      str += prefix + this.wrap(columns[i])
    }
    return str
  },

})

export default MSSQL_Formatter
