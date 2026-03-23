// Tests that ESM consumers can use the standard import patterns
// and access all commonly-used Knex types.

import knex, { type Knex } from 'knex';

// knex is callable and returns a Knex instance
const db: Knex = knex({ client: 'pg', connection: 'postgres://localhost/test' });

// knex accepts a string argument
const db2: Knex = knex('postgres://localhost/test');

// Knex.Config is available
const config: Knex.Config = {
  client: 'pg',
  connection: { host: 'localhost', database: 'test' },
};

// Knex.Transaction is available
type Tx = Knex.Transaction;

// Knex.QueryBuilder is available
type QB = Knex.QueryBuilder;

// Knex.Raw is available
type RawQuery = Knex.Raw;

// Knex.SchemaBuilder is available
type SB = Knex.SchemaBuilder;

// Named knex export also works
import { knex as knexNamed } from 'knex';
const db3: Knex = knexNamed({ client: 'pg' });
