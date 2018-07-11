import { ColumnCompiler_Oracle } from '../../oracle/schema/columncompiler';

export class ColumnCompiler_Oracledb extends ColumnCompiler_Oracle {
  time = 'timestamp with local time zone';

  datetime(without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  }

  timestamp(without) {
    return without ? 'timestamp' : 'timestamp with local time zone';
  }
}

export default ColumnCompiler_Oracledb;
