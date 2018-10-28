#!/bin/bash -e

export PATH="$PATH:$(dirname "$0")/../node_modules/.bin/"
export KNEX_PATH="$(realpath "$(dirname "$0")/../knex.js")"
export KNEX=$(dirname "$0")/../bin/cli.js

TEMP=$(mktemp -d)
DB=$TEMP/test.sqlite3
MIGR_DIR=$TEMP/migrations
mkdir $MIGR_DIR

function fail() {
  echo "☒ $1" >&2
  exit 1
}

$KNEX migrate:make --client=sqlite3 --migrations-directory=$MIGR_DIR create_rule_table > /dev/null

migration=$( ls $MIGR_DIR/*_create_rule_table.js )

test -e $migration || fail 'No migration was created.'

grep -q 'exports.up' $migration || fail 'The migration was not created as expected.'

echo '☑ The migration was created as expected.'

echo "
    exports.up = (knex)=> knex.schema.createTable('rules', (table)=> {
        table.string('name');
    });
    exports.down = (knex)=> knex.schema.dropTable('rules');
" > $migration

$KNEX migrate:latest --client=sqlite3 --connection=$DB --migrations-directory=$MIGR_DIR > /dev/null

test -e $DB || fail 'No database was created.'

sqlite3 $DB .dump | grep -q 'CREATE TABLE `rules`' || fail 'The table was not created.'

echo '☑ The migration ran as expected.'

rm -r "$TEMP"
