// Firebird Formatter
// -------

import inherits from 'inherits';
import { assign } from 'lodash';
import Formatter from '../../formatter';

function Firebird_Formatter(client, builder) {
  Formatter.call(this, client, builder);
}
inherits(Firebird_Formatter, Formatter);

assign(Firebird_Formatter.prototype, {
  alias(first, second) {
    return first + ' ' + second;
  },

  parameter(value, notSetValue) {
    return Formatter.prototype.parameter.call(this, value, notSetValue);
  },

  columnizeWithPrefix(prefix, target) {
    const columns = typeof target === 'string' ? [target] : target;
    let str = '',
      i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', ';
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  },
});

export default Firebird_Formatter;
