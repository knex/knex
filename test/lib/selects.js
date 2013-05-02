
var Q = require('q');

module.exports = function(Knex, item, handler) {

  describe(item, function() {
  
    it('runs with no conditions', function(ok) {
      Knex('accounts').select().then(handler(ok), ok);
    });
    
    it('does simple "where" cases', function(ok) {
      Q.all([
        Knex('table').where('id', 1).select('column1', 'column2'),
        Knex('table').where('id', '>', 1).select(['column1', 'column2']),
        Knex('table').where({'id': 1}).select('*'),
        Knex('table').where({'id': void 0}).select('*', 'column2'),
        Knex('table').where({'id': null}).select('column1', 'column2'),
        Knex('table').where({'id': ''}).select()
      ]).then(handler(ok), ok);
    });

    it('does "orWhere" cases', function(ok) {
      Q.all([
        Knex('table').where('id', 1).orWhere('id', '>', 2).select('column1', 'column2')
        // More tests can be added here.
      ]).then(handler(ok), ok);
    });

    it('does "andWhere" cases', function(ok) {
      Q.all([
        Knex('table').where('id', 1).select('column1', 'column2'),
        Knex('table').where('id', '>', 1).select(['column1', 'column2']),
        Knex('table').where({'id': 1}).select('*'),
        Knex('table').where({'id': void 0}).select('*', 'column2'),
        Knex('table').where({'id': null}).select('column1', 'column2'),
        Knex('table').where({'id': ''}).select()
      ]).then(handler(ok), ok);
    });

    it('takes a function to wrap nested where statements', function(ok) {
      Q.all([
        Knex('table').where(function() {
          this.where('x', 2);
          this.orWhere('x', 3);
        }).select('*')
      ]).then(handler(ok), ok);
    });

    it('handles "whereIn" cases')

  });

  return;

      // .then(function(sql, bindings) {
      //   equal(sql, 'select `column1`, `column2` from `table` where `id` = ?');
      //   deepEqual(bindings, [1]);
      //   return Knex('table').where('id', '=', 'someValue').select(['column1', 'column2']);
      // }).then(function(sql, bindings) {
      //   equal(sql, 'select `column1`, `column2` from `table` where `id` = ?');
      //   deepEqual(bindings, ['someValue']);
      //   return Knex('table').where({
      //     id: 1,
      //     otherItem: 2
      //   }).andWhere('title', 'test').select();
      // }).then(function(sql, bindings) {
      //   equal(sql, 'select * from `table` where `id` = ? and `otherItem` = ? and `title` = ?');
      //   deepEqual(bindings, [1, 2, 'test']);
      //   ok();
      // }).done();
    // });

    it('handles "or where"', function(ok) {
      Knex('table').where('id', 1).orWhere({id: 2}).select().then(function(sql, bindings) {
        equal(sql, 'select * from `table` where `id` = ? or `id` = ?');
        deepEqual(bindings, [1, 2]);
        return Knex('table').where('id', '=', 'someValue').orWhere('otherId', '>', 10).select();
      }).then(function(sql, bindings) {
        equal(sql, 'select * from `table` where `id` = ? or `otherId` > ?');
        deepEqual(bindings, ['someValue', 10]);
        ok();
      }).done();
    });

    it('handles "where exists"', function(ok) {
      Knex('table').whereExists(function(qb) {
        deepEqual(qb, this);
        return qb.select('column1').from('table2').where({
          id: 1,
          otherItem: 2
        });
      }).select().then(function(sql, bindings) {
        equal(sql, 'select * from `table` where exists (select `column1` from `table2` where `id` = ? and `otherItem` = ?)');
        deepEqual(bindings, [1, 2]);
        ok();
      }).done();
    });

    it('handles "where in"', function(ok) {
      Knex('table').whereIn('id', [1, 2, 3]).select().then(function(sql, bindings) {
        equal(sql, 'select * from `table` where `id` in (?, ?, ?)');
        deepEqual(bindings, [1, 2, 3]);
        ok();
      }).done();
    });

    it('handles "or where in"', function(ok) {
      Knex('table').where('id', 1).orWhereIn('name', ['Tim', 'Joe', 'Bill']).select().then(function(sql, bindings) {
        equal(sql, 'select * from `table` where `id` = ? or `name` in (?, ?, ?)');
        deepEqual(bindings, [1, 'Tim', 'Joe', 'Bill']);
        ok();
      }).done();
    });

    it('handles "where between"', function(ok) {
      Knex('table').whereBetween('id', [1, 100]).select().then(function(sql, bindings) {
        equal(sql, 'select * from `table` where `id` between ? and ?');
        deepEqual(bindings, [1, 100]);
        ok();
      }).done();
    });

    it('handles "or where between"', function(ok) {
      Knex('table').whereBetween('id', [1, 100]).orWhereBetween('id', [200, 300]).select().then(function(sql, bindings) {
        equal(sql, 'select * from `table` where `id` between ? and ? or `id` between ? and ?');
        deepEqual(bindings, [1, 100, 200, 300]);
        ok();
      }).done();
    });
  
    describe('joins', function() {
      it('uses inner join by default', function(ok) {
        Knex('tableName').join('otherTable', 'tableName.id', '=', 'otherTable.otherId').select('tableName.*', 'otherTable.name').then(function(sql, bindings) {
          equal(sql, 'select `tableName`.*, `otherTable`.`name` from `tableName` inner join `otherTable` on `tableName`.`id` = `otherTable`.`otherId`');
          ok();
        }).done();
      });
    
      it('takes a fifth parameter to specify the join type', function(ok) {
        Knex('tableName').join('otherTable', 'tableName.id', '=', 'otherTable.otherId', 'left').select('tableName.*', 'otherTable.name').then(function(sql, bindings) {
          equal(sql, 'select `tableName`.*, `otherTable`.`name` from `tableName` left join `otherTable` on `tableName`.`id` = `otherTable`.`otherId`');
          ok();
        }).done();
      });

      it('accepts a callback as the second argument for advanced joins', function(ok) {
        Knex('tableName').join('table2', function(join) {
          join.on('tableName.one_id', '=', 'table2.tableName_id');
          join.orOn('tableName.other_id', '=', 'table2.tableName_id2');
        }, 'left').select().then(function(sql, bindings) {
          equal(sql, 'select * from `tableName` left join `table2` on `tableName`.`one_id` = `table2`.`tableName_id` or `tableName`.`other_id` = `table2`.`tableName_id2`');
          ok();
        }).done();
      });
    });

  // });
};