Master:

## Master Changes:

- Transactions are immediately invoked as A+ promises - #470 
- Nested transactions automatically become savepoints, 
  with commit & rollback committing or rolling back to the savepoint
- Migrations are now wrapped in transactions where possible
- Using Pool2 in favor of generic-pool-redux
- Support for strong-oracle driver, #580
- Subqueries in insert statements, #627
- Allow mysql2 to use non-default port, #588
- Support creating & dropping extensions in PostgreSQL, #540
- Support for nested having, #572
- CLI support for knexfiles that do not provide environment keys, #527
- Added sqlite3 dialect version of whereRaw/andWhereRaw (#477).
- Support object syntax for joins, similar to "where" #743