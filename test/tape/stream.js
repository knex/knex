'use strict';

const tape = require('tape');
const stream = require('stream');

module.exports = function(knex) {
  if (knex.client.driverName === 'pg') {
    tape('it streams properly in postgres', function(t) {
      const w = new stream.Writable({
        objectMode: true,
      });
      w._write = function(chunk, _, next) {
        setTimeout(next, 10);
      };
      knex
        .raw('select * from generate_series(0, 10, 1)')
        .pipe(w)
        .on('finish', function() {
          t.ok(true, 'Streamed series');
          t.end();
        });
    });
  }
};
