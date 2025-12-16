#!/usr/bin/env bash
set -euo pipefail

pause() {
  read -rp "Press Enter to continue..." _
}

run_db() {
  local start_cmd=$1
  local test_cmd=$2
  local stop_cmd=$3

  echo "=== Starting ${test_cmd} environment ==="
  npm run "$start_cmd"
  pause

  echo "=== Running ${test_cmd} ==="
  if npm run "$test_cmd"; then
    echo "=== ${test_cmd} succeeded ==="
  else
    status=$?
    echo "=== ${test_cmd} failed with status ${status} ==="
    npm run "$stop_cmd"
    exit ${status}
  fi
  pause

  echo "=== Stopping ${test_cmd} environment ==="
  npm run "$stop_cmd"
  pause
}

# PostgreSQL
run_db db:start:postgres test:postgres db:stop:postgres

# PG Native shares the postgres service
run_db db:start:pgnative test:pgnative db:stop:postgres

# MySQL
run_db db:start:mysql test:mysql db:stop:mysql

# MySQL2 (reuse MySQL service)
run_db db:start:mysql test:mysql2 db:stop:mysql

# MSSQL
run_db db:start:mssql test:mssql db:stop:mssql

# CockroachDB
run_db db:start:cockroachdb test:cockroachdb db:stop:cockroachdb

# SQLite
echo "=== Running test:sqlite (no container) ==="
npm run test:sqlite
pause

# Better-SQLite3
echo "=== Running test:better-sqlite3 (no container) ==="
npm run test:better-sqlite3
pause
