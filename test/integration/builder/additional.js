/*global describe, expect, it*/

'use strict';

var Promise = require('bluebird');

module.exports = function(knex) {

  var _ = require('lodash');

  describe('Additional', function () {

    it('should truncate a table with truncate', function() {

      return knex('test_table_two')
        .truncate()
        .testSql(function(tester) {
          tester('mysql', 'truncate `test_table_two`');
          tester('postgresql', 'truncate "test_table_two" restart identity');
          tester('sqlite3', "delete from sqlite_sequence where name = \"test_table_two\"");
          tester('oracle', "truncate table \"test_table_two\"");
          tester('fdbsql', 'truncate table \"test_table_two\"');
        })
        .then(function() {

          return knex('test_table_two')
            .select('*')
            .then(function(resp) {
              expect(resp).to.have.length(0);
            });

        });

    });

    it('should allow raw queries directly with `knex.raw`', function() {
      var tables = {
        mysql: 'SHOW TABLES',
        mysql2: 'SHOW TABLES',
        mariasql: 'SHOW TABLES',
        postgresql: "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
        sqlite3: "SELECT name FROM sqlite_master WHERE type='table';",
        oracle: "select TABLE_NAME from USER_TABLES",
        fdbsql: "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
      };
      return knex.raw(tables[knex.client.dialect]).testSql(function(tester) {
        tester(knex.client.dialect, tables[knex.client.dialect]);
      });
    });

    it('should allow using the primary table as a raw statement', function() {
      expect(knex(knex.raw("raw_table_name")).toQuery()).to.equal('select * from raw_table_name');
    });

    it('should allow using .fn-methods to create raw statements', function() {
      expect(knex.fn.now().prototype === knex.raw().prototype);
      expect(knex.fn.now().toQuery()).to.equal('CURRENT_TIMESTAMP');
    });

    it('gets the columnInfo', function() {
      return knex('datatype_test').columnInfo().testSql(function(tester) {
        tester('mysql',
          'select * from information_schema.columns where table_name = ? and table_schema = ?',
          null, {
            "enum_value": {
              "defaultValue": null,
              "maxLength": 1,
              "nullable": true,
              "type": "enum"
            },
            "uuid": {
              "defaultValue": null,
              "maxLength": 36,
              "nullable": false,
              "type": "char"
            }
          });
        tester('postgresql', 'select * from information_schema.columns where table_name = ? and table_catalog = ?',
        null, {
          "enum_value": {
            "defaultValue": null,
            "maxLength": null,
            "nullable": true,
            "type": "text"
          },
          "uuid": {
            "defaultValue": null,
            "maxLength": null,
            "nullable": false,
            "type": "uuid"
          }
        });
        tester('sqlite3', 'PRAGMA table_info(datatype_test)', [], {
          "enum_value": {
            "defaultValue": null,
            "maxLength": null,
            "nullable": true,
            "type": "varchar"
          },
          "uuid": {
            "defaultValue": null,
            "maxLength": "36",
            "nullable": false,
            "type": "char"
          }
        });
        tester(
          'oracle',
          "select COLUMN_NAME, DATA_TYPE, CHAR_COL_DECL_LENGTH, NULLABLE from USER_TAB_COLS where TABLE_NAME = :1",
          ['datatype_test'],
          {
            "enum_value": {
              nullable: true,
              maxLength: 1,
              type: "VARCHAR2"
            },
            "uuid": {
              nullable: false,
              maxLength: 36,
              type: "CHAR"
            }
          }
        );
        tester(
          'fdbsql',
          'select * from information_schema.columns where table_name = ? and table_schema = ? and table_schema = CURRENT_SCHEMA',
          null,
          {
            "enum_value": {
              "defaultValue": null,
              "maxLength": 1,
              "nullable": true,
              "type": "VARCHAR"
            },
            "uuid": {
              "defaultValue": null,
              "maxLength": null,
              "nullable": false,
              "type": "GUID"
            }
          }
        );
      });
    });

    it('gets the columnInfo', function() {
      return knex('datatype_test').columnInfo('uuid').testSql(function(tester) {
        tester('mysql',
          'select * from information_schema.columns where table_name = ? and table_schema = ?',
          null, {
            "defaultValue": null,
            "maxLength": 36,
            "nullable": false,
            "type": "char"
          });
        tester('postgresql', 'select * from information_schema.columns where table_name = ? and table_catalog = ?',
        null, {
          "defaultValue": null,
          "maxLength": null,
          "nullable": false,
          "type": "uuid"
        });
        tester('sqlite3', 'PRAGMA table_info(datatype_test)', [], {
          "defaultValue": null,
          "maxLength": "36",
          "nullable": false,
          "type": "char"
        });
        tester(
          'oracle',
          'select COLUMN_NAME, DATA_TYPE, CHAR_COL_DECL_LENGTH, NULLABLE from USER_TAB_COLS where TABLE_NAME = :1',
          ['datatype_test'],
          {
            "maxLength": 36,
            "nullable": false,
            "type": "CHAR"
          }
        );
        tester('fdbsql', 'select * from information_schema.columns where table_name = ? and table_schema = ? and table_schema = CURRENT_SCHEMA',
          null, {
          "defaultValue": null,
          "maxLength": null,
          "nullable": false,
          "type": "GUID"
        });
      });
    });

    it('should allow renaming a column', function() {
      var count, inserts = [];
      _.times(40, function() {
        inserts.push({first_name: 'Test', last_name: 'Data'});
      });
      return knex('accounts').insert(inserts).then(function() {
        return knex.count('*').from('accounts');
      }).then(function(resp) {
        count = resp['count(*)'];
        return knex.schema.table('accounts', function(t) {
          t.renameColumn('about', 'about_col');
        }).testSql(function(tester) {
          tester('mysql', ["show fields from `accounts` where field = ?"]);
          tester('postgresql', ["alter table \"accounts\" rename \"about\" to \"about_col\""]);
          tester('sqlite3', ["PRAGMA table_info(\"accounts\")"]);
          tester('oracle', ["alter table \"accounts\" rename column \"about\" to \"about_col\""]);
          tester('fdbsql', ["alter table \"accounts\" rename column \"about\" to \"about_col\""]);
        });
      }).then(function() {
        return knex.count('*').from('accounts');
      }).then(function(resp) {
        expect(resp['count(*)']).to.equal(count);
      }).then(function() {
        return knex('accounts').select('about_col');
      }).then(function() {
        return knex.schema.table('accounts', function(t) {
          t.renameColumn('about_col', 'about');
        });
      }).then(function() {
        return knex.count('*').from('accounts');
      }).then(function(resp) {
        expect(resp['count(*)']).to.equal(count);
      });
    });

    it('should allow dropping a column', function() {
      var count;

      if (knex.client.dialect === 'oracle') {
        return knex.count('*').from('accounts').then(function (resp) {
          count = resp[0]['COUNT(*)'];
        }).then(function () {
          return knex.schema.table('accounts', function (t) {
            t.dropColumn('first_name');
          }).testSql(function (tester) {
            tester('oracle', ['alter table "accounts" drop ("first_name")']);
          });
        }).then(function () {
          return knex.select('*').from('accounts').first();
        }).then(function(resp) {
          expect(_.keys(resp).sort()).to.eql(["about", "created_at", "email", "id", "last_name", "logins", "phone", "updated_at"]);
        }).then(function() {
          return knex.count('*').from('accounts');
        }).then(function(resp) {
          expect(resp[0]['COUNT(*)']).to.equal(count);
        });
      }

      return knex.count('*').from('accounts').then(function(resp) {
        count = resp['count(*)'];
      }).then(function() {
        return knex.schema.table('accounts', function(t) {
          t.dropColumn('first_name');
        }).testSql(function(tester) {
          tester('mysql', ["alter table `accounts` drop `first_name`"]);
          tester('postgresql', ['alter table "accounts" drop column "first_name"']);
          tester('sqlite3', ["PRAGMA table_info(\"accounts\")"]);
          tester('fdbsql', ['alter table "accounts" drop column "first_name"']);
        });
      }).then(function() {
        return knex.select('*').from('accounts').first();
      }).then(function(resp) {
        expect(_.keys(resp).sort()).to.eql(["about", "created_at", "email", "id", "last_name", "logins", "phone", "updated_at"]);
      }).then(function() {
        return knex.count('*').from('accounts');
      }).then(function(resp) {
        expect(resp['count(*)']).to.equal(count);
      });
    });

  });

  it('throws on an invalid hook type', function () {
    expect(function () {
      return knex.select('foo')
        .hook('fail', function () { });
    }).to.throw('Invalid arguments');
  });
  it('executes the "after" hook', function () {
    var ran = false;
    return knex.select('foo')
      .hook('after', function () {
        ran = true;
      })
      .then(function () {
        expect(ran).to.equal(true);
      });
  });
  it('propagates changes', function () {
    return knex.select('foo AS foo')
      .hook('after', function (data) {
        data.foo = 'bar';
        return data.map(function (item) {
            item.foo = 'bar';
            return item;
        });
      })
      .then(function (data) {
        expect(data[0].foo).to.equal('bar');
      });
  });
  it('allows returning a promise', function () {
    return knex.select('foo')
      .hook('after', function (data) {
        return Promise.map(data, function (item) {
            item.foo = 'bar';
            return item;
        });
      })
      .then(function (data) {
        expect(data[0].foo).to.equal('bar');
      });
  });
  it('returns the input value if nothing is returned', function () {
    return knex.select('foo AS foo')
      .hook('after', function () {
        return;
      })
      .then(function (data) {
        expect(data).to.eql([{foo: 'foo'}]);
      });
  });
  it('executes hooks in the order they were called', function () {
    var count = 0;
    return knex.select('foo')
      .hook('after', function () {
        count++;
        expect(count).to.equal(1);
      })
      .hook('after', function () {
        count++;
        expect(count).to.equal(2);
      });
  });



};
