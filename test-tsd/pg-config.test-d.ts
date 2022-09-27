import { expectAssignable } from 'tsd';

import {Knex} from '../types';
import * as stream from "stream";

expectAssignable<Knex.PgConnectionConfig>({
  user: '',
  database: '',
  password: '',
  port: 1,
  host: '',
  connectionString: '',
  keepAlive: true,
  stream: new stream.Duplex(),
  statement_timeout: false,
  parseInputDatesAsUTC: false,
  ssl: true,
  query_timeout: 2,
  keepAliveInitialDelayMillis: 3,
  idle_in_transaction_session_timeout: 4,
  application_name: '',
  connectionTimeoutMillis: 5,
  types: {
    getTypeParser: () => {},
  },
  options: '',
  expirationChecker: () => {return true;},
});
