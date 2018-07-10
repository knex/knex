import ColumnCompiler_Oracle from '../../oracle/schema/columncompiler';

export default class ColumnCompiler_Oracledb extends ColumnCompiler_Oracle {
  time = 'timestamp with local time zone';

  datetime(without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  }

  timestamp(without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  }
}
