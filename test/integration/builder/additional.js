/*global describe, expect, it*/

'use strict';

module.exports = function(knex) {

  var _ = require('lodash');

  describe('Additional', function () {

    it('should truncate a table with truncate', function() {

      return knex('test_table_two')
        .truncate()
        .testSql(function(tester) {
          tester('mysql', 'truncate `test_table_two`');
          tester('postgresql', 'truncate "test_table_two" restart identity');
          tester('sqlite3', "delete from \"test_table_two\"");
          tester('oracle', "truncate table \"test_table_two\"");
          tester('mssql', 'truncate table [test_table_two]');
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
        mariadb: 'SHOW TABLES',
        postgresql: "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
        sqlite3: "SELECT name FROM sqlite_master WHERE type='table';",
        oracle: "select TABLE_NAME from USER_TABLES",
        mssql: "SELECT table_name FROM information_schema.tables WHERE table_schema='dbo'"
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
        tester('postgresql', 'select * from information_schema.columns where table_name = ? and table_catalog = ? and table_schema = current_schema',
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
        tester('mssql',
          'select * from information_schema.columns where table_name = ? and table_schema = \'dbo\'',
          ['datatype_test'], {
            "enum_value": {
              "defaultValue": null,
              "maxLength": 100,
              "nullable": true,
              "type": "nvarchar"
            },
            "uuid": {
              "defaultValue": null,
              "maxLength": null,
              "nullable": false,
              "type": "uniqueidentifier"
            }
          });
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
        tester('postgresql', 'select * from information_schema.columns where table_name = ? and table_catalog = ? and table_schema = current_schema',
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
        tester('mssql',
          'select * from information_schema.columns where table_name = ? and table_schema = \'dbo\'',
          null, {
            "defaultValue": null,
            "maxLength": null,
            "nullable": false,
            "type": "uniqueidentifier"
          });
      });
    });

    it('should allow renaming a column', function() {
      var countColumn
      console.log(knex.client.dialect);
      switch (knex.client.dialect) {
        case 'oracle': countColumn = 'COUNT(*)'; break;
        case 'mssql': countColumn = ''; break;
        default: countColumn = 'count(*)'; break;
      }
      var count, inserts = [];
      _.times(40, function(i) {
        inserts.push({email: 'email'+ i, first_name: 'Test', last_name: 'Data'});
      });
      return knex('accounts').insert(inserts).then(function() {
        return knex.count('*').from('accounts');
      }).then(function(resp) {
        count = resp[0][countColumn];
        return knex.schema.table('accounts', function(t) {
          t.renameColumn('about', 'about_col');
        }).testSql(function(tester) {
          tester('mysql', ["show fields from `accounts` where field = ?"]);
          tester('postgresql', ["alter table \"accounts\" rename \"about\" to \"about_col\""]);
          tester('sqlite3', ["PRAGMA table_info(\"accounts\")"]);
          tester('oracle', ["alter table \"accounts\" rename column \"about\" to \"about_col\""]);
          tester('mssql', ["exec sp_rename ?, ?, 'COLUMN'"]);
        });
      }).then(function() {
        return knex.count('*').from('accounts');
      }).then(function(resp) {
        expect(resp[0][countColumn]).to.equal(count);
      }).then(function() {
        return knex('accounts').select('about_col');
      }).then(function() {
        return knex.schema.table('accounts', function(t) {
          t.renameColumn('about_col', 'about');
        });
      }).then(function() {
        return knex.count('*').from('accounts');
      }).then(function(resp) {
        expect(resp[0][countColumn]).to.equal(count);
      });
    });

    it('should allow dropping a column', function() {
      var countColumn
      switch (knex.client.dialect) {
        case 'oracle': countColumn = 'COUNT(*)'; break;
        case 'mssql': countColumn = ''; break;
        default: countColumn = 'count(*)'; break;
      }
      var count;
      return knex.count('*').from('accounts').then(function(resp) {
        count = resp[0][countColumn];
      }).then(function() {
        return knex.schema.table('accounts', function(t) {
          t.dropColumn('first_name');
        }).testSql(function(tester) {
          tester('mysql', ["alter table `accounts` drop `first_name`"]);
          tester('postgresql', ['alter table "accounts" drop column "first_name"']);
          tester('sqlite3', ["PRAGMA table_info(\"accounts\")"]);
          tester('oracle', ['alter table "accounts" drop ("first_name")']);
          tester('mssql', ["ALTER TABLE [accounts] DROP COLUMN [first_name]"]);
        });
      }).then(function() {
        return knex.select('*').from('accounts').first();
      }).then(function(resp) {
        expect(_.keys(resp).sort()).to.eql(["about", "created_at", "email", "id", "last_name", "logins", "phone", "updated_at"]);
      }).then(function() {
        return knex.count('*').from('accounts');
      }).then(function(resp) {
        expect(resp[0][countColumn]).to.equal(count);
      });
    });


    it('.timeout() should throw TimeoutError', function(done) {
      var dialect = knex.client.config.dialect;
      if(dialect === 'sqlite3') { return done(); } //TODO -- No built-in support for sleeps
      var testQueries = {
        'postgres': function() {
          return knex.raw('SELECT pg_sleep(1)');
        },
        'mysql': function() {
          return knex.raw('SELECT SLEEP(1)');
        },
        'mysql2': function() {
          return knex.raw('SELECT SLEEP(1)');
        },
        maria: function() {
          return knex.raw('SELECT SLEEP(1)');
        },
        mssql: function() {
          return knex.raw('WAITFOR DELAY \'00:00:01\'');
        },
        oracle: function() {
          return knex.raw('dbms_lock.sleep(1)');
        },
        'strong-oracle': function() {
          return knex.raw('dbms_lock.sleep(1)');
        }
      };

      if(!testQueries.hasOwnProperty(dialect)) {
        return done(new Error('Missing test query for dialect: ' + dialect));
      }

      var query = testQueries[dialect]();

      return query.timeout(1)
        .then(function() {
          expect(true).to.equal(false);
        })
        .catch(function(error) {
          expect(_.pick(error, 'timeout', 'name', 'message')).to.deep.equal({
            timeout: 1,
            name:    'TimeoutError',
            message: 'Defined query timeout of 1ms exceeded when running query.'
          });
          done();
        });
    });


    it('Event: query-response', function() {
      var queryCount = 0;

      knex.on('query-response', function(response, obj, builder) {
        queryCount++;
        expect(response).to.be.an('array');
        expect(obj).to.be.an('object');
        expect(obj.__knexUid).to.be.a('string');
        expect(builder).to.be.an('object');
      });

      return knex('accounts').select()
      .then(function() {
          return knex.transaction(function(tr) {
            return tr('accounts').select(); //Transactions should emit the event as well
          })
        })
      .then(function() {
          expect(queryCount).to.equal(2);
      })
    });

  });

};
