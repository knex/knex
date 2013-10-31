var _       = require('underscore');
var when    = require('when');
var Builder = require('../../lib/builder').Builder;
var Common  = require('../../lib/common').Common;
var Raw     = require('../../lib/raw').Raw;

describe('Builder', function () {

  var builder;
  beforeEach(function() {
    builder = new Builder({
      query: function(obj) {
        return when.resolve(obj);
      },
      grammar: require('../../clients/server/mysql/grammar').grammar
    });
  });

  describe('constructor', function () {

    it('accepts the current Knex instance, attaching the client, and grammar', function() {
      var grammar = {some: 'grammar'};
      var client  = {some: 'db'};
      var knex    = {client: client, grammar: grammar};
      var reset   = sinon.stub(Builder.prototype, 'reset');
      var builder = new Builder(knex);

      expect(builder.knex).to.eql(knex);
      expect(builder.client).to.eql(client);
      expect(builder.grammar).to.eql(grammar);
      reset.should.have.been.calledOnce;
      reset.restore();
    });

  });

  describe('from', function() {

    it('sets the tableName', function() {
      expect(builder.table).to.be.empty;
      var result = builder.from('myTable');
      expect(builder.table).to.equal('myTable');
      expect(result).to.equal(builder);
    });

    it('returns the tableName when no arguments are passed', function() {
      expect(builder.table).to.be.empty;
      var result = builder.from('myTable');
      expect(builder.from()).to.equal('myTable');
    });

  });

  describe('column', function() {

    it('adds a value to the columns array', function() {
      expect(builder.columns).to.have.length(0);
      builder.column('myColumn');
      expect(builder.columns).to.have.length(1);
    });

  });

  describe('distinct', function() {

    it('sets the isDistinct flag to true', function() {
      builder.distinct('distinctCol');
      expect(builder.columns[0]).to.equal('distinctCol');
    });

    it('adds the column to the columns array', function() {
      builder.distinct('distinctCol');
      expect(builder.flags.distinct).to.be.true;
    });

  });

  describe('toSql', function() {

    it('sets the type to "select" if not otherwise set', function() {
      expect(builder.type).not.to.exist;
      builder.toSql();
      expect(builder.type).to.equal('select');
    });

    it('compiles based on the type, passing the current context', function(done) {
      var compileSelect = builder.grammar.compileSelect;
      builder.grammar.compileSelect = function(ctx) {
        expect(ctx).to.eql(builder);
        builder.grammar.compileSelect = compileSelect;
        done();
      };
      builder.toSql();
    });

  });

  describe('toString', function() {

    it('should properly escape the query string', function() {

      var output = "select * from `items` outer join `users` on `items`.`id` = `users`.`id` where `id` = 'User' or `id` = (SELECT id from otheritems)";

      expect(builder
        .from('items')
        .join('users', function() {
          this.on('items.id', '=', 'users.id');
          this.type('outer');
        })
        .where('id', '=', 'User')
        .orWhere('id', '=', new Raw({}).query('(SELECT id from otheritems)')).toString()).to.equal(output);

    });


    it('should call toString correctly on count()', function() {

      var output = "select count(`id`) as aggregate from `users`";

      expect(builder.from('users').count('id').toString()).to.equal(output);

    });

  });

  describe('clone', function() {

    it('should keep the correct type when cloning the instance', function() {
      var cloned = builder.insert({a: 'value'}).into('tableName').clone();
      expect(cloned.type).to.equal('insert');
    });

  });

  describe('reset', function() {

  });

  describe('join', function() {

    var JoinClause = require('../../lib/builder/joinclause').JoinClause;

    it('accepts the joining table, the first column, operator, second column, and (optional) type', function() {
      expect(builder.joins).to.have.length(0);
      builder.from('users');
      builder.join('accounts', 'users.id', '=', 'accounts.id');
      expect(builder.joins).to.have.length(1);
      expect(builder.joins[0]).to.be.an.instanceOf(JoinClause);
      expect(builder.toString()).to.equal("select * from `users` inner join `accounts` on `users`.`id` = `accounts`.`id`");
    });

    it('accepts a different join type as the fifth parameter', function() {
      builder.from('users');
      builder.join('accounts', 'users.id', '=', 'accounts.id', 'left outer');
      expect(builder.toString()).to.equal("select * from `users` left outer join `accounts` on `users`.`id` = `accounts`.`id`");
    });

    it('may take a function as the second argument, for a grouped join', function() {

      builder.join('accounts', function(join) {
        expect(builder.joins).to.have.length(0);
        expect(this).to.be.an.instanceOf(JoinClause);
        expect(join).to.be.an.instanceOf(JoinClause);
      });

    });

  });

  describe('where', function() {

    describe('where', function() {

      it('should allow a function as the first argument, for a grouped where clause', function() {
        builder.where('id', '=', 1);
        expect(builder.wheres).to.have.length(1);
        expect(builder.bindings).to.have.length(1);
        var subWhere = function(qb) {
          expect(this).to.equal(qb);
          expect(this).to.be.an.instanceOf(Builder);
          this.where({id: 3}).orWhere('id', 4);
        };
        builder.where(subWhere);
        expect(builder.bindings).to.have.length(3);
        expect(builder.wheres).to.have.length(2);
        expect(builder.from('test').toString()).to.equal("select * from `test` where `id` = 1 and (`id` = 3 or `id` = 4)");
      });

      it('should allow a raw instance as the first argument, which will add a whereRaw clause', function() {
        builder.where(new Raw({}).query('id > ?', 2));
        expect(builder.wheres).to.have.length(1);
        expect(builder.bindings).to.have.length(1);
        expect(builder.bindings[0]).to.equal(2);
      });

      it('should allow an object as the first argument, which will assume to be a k/v pair of where "="', function() {
        builder.where({id: 2, name: 'Test'});
        expect(builder.wheres).to.have.length(2);
        expect(builder.bindings).to.have.length(2);
      });

      it('should assume that if the second argument is not an operator, it should be an "="', function() {
        builder.where('id', 2);
        expect(builder.wheres).to.have.length(1);
        expect(builder.bindings[0]).to.equal(2);
      });

      it('should accept a function as the "value", for a sub select', function() {
        builder.where('id', '=', function(qb) {
          expect(this).to.equal(qb);
          expect(this).to.be.an.instanceOf(Builder);
          this.select('account_id').from('names').where('names.id', '>', 1).orWhere(function() {
            this.where('names.first_name', 'like', 'Tim%').andWhere('names.id', '>', 10);
          });
        });
        expect(builder.bindings).to.have.length(3);
        expect(builder.toString()).to.equal("select * where `id` = (select `account_id` from `names` where `names`.`id` > 1 or (`names`.`first_name` like 'Tim%' and `names`.`id` > 10))");
      });

      it('should not do whereNull on where("foo", "<>", null) #76', function() {
        var query = builder.where('foo', '<>', null);
        expect(query.toString()).to.equal('select * where `foo` <> NULL');
      });

      it('should expand where("foo", "!=") to - where id = "!="', function() {
        var query = builder.where('foo', '!=');
        expect(query.toString()).to.equal("select * where `foo` = '!='");
      });

    });

    describe('transacting', function() {

      it('accepts an object once - otherwise throws an error', function() {

        var trx = {};

        builder.transacting(trx);

        expect(builder.transaction).to.eql(trx);

        try {
          builder.transacting(trx);
        } catch (e) {
          expect(e.message).to.equal('A transaction has already been set for the current query chain');
        }

      });

      it('attaches two methods, forUpdate and forShare', function() {

        expect(builder.forUpdate).to.not.exist;

        expect(builder.forShare).to.not.exist;

        builder.transacting({});

        expect(builder.forUpdate).to.be.a('function');

        expect(builder.forShare).to.be.a('function');

      });

      it('adds a forUpdate or forShare clause to the query, but not both', function() {

        var qb = builder.select('*').from('users').transacting({}).where('id', '>', 10);

        qb.forShare();

        expect(qb.toString()).to.equal('select * from `users` where `id` > 10 lock in share mode');

        qb.forUpdate();

        expect(qb.toString()).to.equal('select * from `users` where `id` > 10 for update');

      });

    });

    describe('whereRaw', function() {

      it('is called by orWhereRaw, passing the sql, bindings, and "or"', function() {

      });

    });

    describe('whereExists', function() {

    });

  });

  describe('groupBy', function() {

  });

  describe('orderBy', function() {

    it('should default to "asc" if no value is provided', function() {

      builder.orderBy('columnName');

      expect(builder.orders[0].column).to.equal('columnName');

      expect(builder.orders[0].direction).to.equal('asc');

    });

    it('should not allow any values other than "asc" or "desc"', function() {

      builder.orderBy('columnName', 'desc, select * from items');

      expect(builder.orders[0].column).to.equal('columnName');

      expect(builder.orders[0].direction).to.equal('asc');

    });

    it('should not allow capitalized "desc"', function() {

      builder.orderBy('columnName', 'DESC');

      expect(builder.toString()).to.equal("select * order by `columnName` DESC");

      builder.reset();

      builder.orderBy('columnName', 'ASC');

      expect(builder.toString()).to.equal("select * order by `columnName` ASC");

    });

  });

  describe('union', function() {

  });

  describe('having', function() {

  });

  describe('offset / limit', function() {

  });

  describe('aggregate', function() {

  });

  describe('select', function() {

    it('should throw if a table has not been specified when compiling');

  });

  describe('insert', function() {

    it('sets the type to insert', function() {
      builder.insert();
      expect(builder.type).to.equal('insert');
    });

    it('sets the values to be insert', function() {
      var spy = sinon.spy(builder, 'prepValues');
      builder.insert({key: 1, key2: 2});
      spy.should.have.been.calledOnce;
    });

    it('sorts the values in arrays', function() {
      builder.insert([{key1: 'tim', key2: 'test'}, {key2: 'test2', key1: null}]);
      expect(_.map(builder.values, function(val) {
        return _.pluck(val, '0');
      })).to.eql([['key1', 'key2'], ['key1', 'key2']]);
    });

    it('does not mutate the values being inserted', function() {
      var x = [{a: 1}, {b: 2}];
      var y = [{a: 1}, {b: 2}];
      builder.insert(x);
      expect(x).to.eql(y);
    });

    it('takes a second argument to set the isReturning, using the returning method', function() {
      expect(builder.flags.returning).to.be.empty;
      builder.insert({'insert': 'val'}, 'user_id');
      expect(builder.flags.returning).to.equal('user_id');
    });

  });

  describe('update', function() {

    it('sorts the values in arrays', function() {
      builder.update({key1: 'tim', key2: 'test'});
      expect(_.pluck(builder.values, '0')).to.eql(['key1', 'key2']);
      expect(builder.bindings).to.have.length(2);
    });

  });

  describe('delete', function() {

  });

  describe('truncate', function() {

  });

});
