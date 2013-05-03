var Q = require('q');
module.exports = function(Knex, item, handler) {

  describe(item, function() {
  
    it('runs with no conditions', function(ok) {
      Knex('accounts').select().then(handler(ok), ok);
    });
    
    it('does simple "where" cases', function(ok) {
      Q.all([
        Knex('table').where('id', 1).select('first_name', 'last_name'),
        Knex('table').where('id', '>', 1).select(['email', 'logins']),
        Knex('table').where({'id': 1}).select('*'),
        Knex('table').where({'id': void 0}).select('*'),
        Knex('table').where({'id': null}).select('first_name', 'email'),
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
        Knex('table').select('first_name', 'last_name', 'about').where('id', 1).andWhere('email', 'test@example.com')
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

    it('handles "where in" cases', function(ok) {
      Q.all([
        Knex('accounts').whereIn('x', [1, 2, 3]).select()
      ]).then(handler(ok), ok);
    });

    it('handles "or where in" cases', function(ok) {
      Knex('table')
        .where('id', 1)
        .orWhereIn('id', [2, 3, 4])
        .select()
        .then(handler(ok), ok);
    });

    it('handles "where exists"', function(ok) {
      Knex('accounts')
        .whereExists(function(qb) {
          this.select('column1').from('table2').where({id: 1, otherItem: 2});
        })
        .select()
        .done(handler(ok), ok);
    });

    it('handles "where between"', function(ok) {
      Knex('table').whereBetween('id', [1, 100])
        .select()
        .then(handler(ok), ok);
    });

    it('handles "or where between"', function(ok) {
      Knex('table')
        .whereBetween('id', [1, 100])
        .orWhereBetween('id', [200, 300])
        .select()
        .then(handler(ok), ok);
    });

    describe('joins', function() {

      it('uses inner join by default', function(ok) {
        Knex('tableName')
          .join('otherTable', 'tableName.id', '=', 'otherTable.otherId')
          .select('tableName.*', 'otherTable.name')
          .then(handler(ok), ok);
      });

      it('takes a fifth parameter to specify the join type', function(ok) {
        Knex('tableName')
          .join('otherTable', 'tableName.id', '=', 'otherTable.otherId', 'left')
          .select('tableName.*', 'otherTable.name')
          .then(handler(ok), ok);
      });
    

      it('accepts a callback as the second argument for advanced joins', function(ok) {
        Knex('tableName').join('table2', function(join) {
          join.on('tableName.one_id', '=', 'table2.tableName_id');
          join.orOn('tableName.other_id', '=', 'table2.tableName_id2');
        }, 'left')
        .select()
        .then(handler(ok), ok);
      });

    });

  });

};