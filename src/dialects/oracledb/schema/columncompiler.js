import inherits from 'inherits';
import { assign } from 'lodash';
import ColumnCompiler_Oracle from '../../oracle/schema/columncompiler';

export default function ColumnCompiler_Oracledb() {
  ColumnCompiler_Oracle.apply(this, arguments);
}

inherits(ColumnCompiler_Oracledb, ColumnCompiler_Oracle);

assign(ColumnCompiler_Oracledb.prototype, {
  time: 'timestamp with local time zone',

  datetime: function(without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  },

  timestamp: function(without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  },
});
