'use strict';

var tape   = require('tape')
var stream = require('readable-stream')

module.exports = function(knex) {

  if (knex.client.driverName === 'pg') {
    tape('it streams properly in postgres', function(t) {
      var w = new stream.Writable({
        objectMode: true
      })
      w._write = function(chunk, _, next) {
        setTimeout(next, 10);
      }
      knex.raw('select * from generate_series(0, 10, 1)').pipe(w).on('finish', function () {
        console.log('finished');
        t.end()
      });
    })
  }

  if (knex.client.driverName === 'oracledb') {
    tape('it streams properly in oracle', function(t) {
      var writableStream = new stream.Writable({
        objectMode: true
      });
      w._write = function(chunk, _, next) {
        setTimeout(next, 10);
      }
      knex.raw('select Rownum r From dual Connect By Rownum <= 10').pipe(w).on('finish', function () {
        console.log('finished');
        t.end()
      });
    })
  }
}
