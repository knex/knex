Master:

## Major Changes (0.8):

- Transactions are immediately invoked / used as promises (TODO)

## Master Changes:

- Pool2 in favor of generic-pool-redux
- Support for strong-oracle driver, #580
- Support for FoundationDB, #641
- Subqueries in insert statements, #627
- Allow mysql2 to use non-default port, #588
- Support creating & dropping extensions in PostgreSQL, #540
- Support for nested having, #572
- CLI support for knexfiles that do not provide environment keys, #527
- Added sqlite3 dialect version of whereRaw/andWhereRaw (#477).


## 0.7.4

- Fix incorrect order of subquery arguments, #704
- Union wrap argument param, #660
- Fix for dropColumn in last column, #544
- Fix for subqueries in insert statements, #628
- Limit 0 is properly supported, #586
- hasTable fix on mysql, #597
- Add POSIX operator support for Postgres (#562)
- Apply promise args from then instead of explicitly passing.
- Sample seed files now correctly (#391)