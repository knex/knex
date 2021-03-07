'use strict';

const tape = require('tape');
const stream = require('stream');
const { isPostgreSQL } = require('../util/db-helpers');

module.exports = function (knex) {
  if (isPostgreSQL(knex)) {
    tape('it streams properly in postgres', function (t) {
      const w = new stream.Writable({
        objectMode: true,
      });
      w._write = function (chunk, _, next) {
        setTimeout(next, 10);
      };
      knex
        .raw('select * from generate_series(0, 10, 1)')
        .pipe(w)
        .on('finish', function () {
          t.ok(true, 'Streamed series');
          t.end();
        });
    });
  }
};
