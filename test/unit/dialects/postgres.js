/*Please modify your config if necessary*/

'use strict';
var expect = require('chai').expect;
var equal = require('assert').equal;
var knex = require('../../../knex');

var knexInstance;
var sql;

describe('PostgreSQL Config', function () {
  var config = {
    client: 'pg',
    connection: {
      user: 'postgres',
      password: '',
      host: '127.0.0.1',
      database: 'knex_test'
    }
  };
  describe('check version', function () {
    describe('check version < 9.2', function () {
      beforeEach(function () {
        config.version = '7.2';
        knexInstance = knex(config);
      });

      it('json', function () {
        sql = knexInstance.schema.table('public', t => {
          t.json('test_name');
        }).toSQL();
        equal(sql[0].sql, 'alter table "public" add column "test_name" text');
      });

      it('jsonb', function () {
        sql = knexInstance.schema.table('public', t => {
          t.jsonb('test_name');
        }).toSQL();
        equal(sql[0].sql, 'alter table "public" add column "test_name" text');
      });
    });

    describe('check version >= 9.2', function () {
      beforeEach(function () {
        config.version = '9.5';
        knexInstance = knex(config);
      });

      it('json', function () {
        sql = knexInstance.schema.table('public', t => {
          t.json('test_name');
        }).toSQL();
        equal(sql[0].sql, 'alter table "public" add column "test_name" json');
      });

      it('jsonb', function () {
        sql = knexInstance.schema.table('public', t => {
          t.jsonb('test_name');
        }).toSQL();
        equal(sql[0].sql, 'alter table "public" add column "test_name" jsonb');
      });
    });
  });
});
