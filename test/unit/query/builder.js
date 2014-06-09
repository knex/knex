module.exports = function(pgclient, mysqlclient, sqlite3client) {

  var Raw = require('../../../lib/raw');

  describe("QueryBuilder", function() {

    var chain;

    var sql = function () { return new pgclient.QueryBuilder(); };
    var mysql = function () { return new mysqlclient.QueryBuilder(); };
    var sqlite3 = function () { return new sqlite3client.QueryBuilder(); };
    var raw = function(sql, bindings) { return new Raw(sql, bindings); };

    it("basic select", function() {
      chain = sql().select('*').from('users').toSQL();
      expect(chain.sql).to.equal('select * from "users"');
    });

    it("adding selects", function() {
      chain = sql().select('foo').select('bar').select(['baz', 'boom']).from('users').toSQL();
      expect(chain.sql).to.equal('select "foo", "bar", "baz", "boom" from "users"');
    });

    it("basic select distinct", function() {
      chain = sql().distinct().select('foo', 'bar').from('users').toSQL();
      expect(chain.sql).to.equal('select distinct "foo", "bar" from "users"');
    });

    it("basic alias", function() {
      chain = sql().select('foo as bar').from('users').toSQL();
      expect(chain.sql).to.equal('select "foo" as "bar" from "users"');
    });

    it("basic table wrapping", function() {
      chain = sql().select('*').from('public.users').toSQL();
      expect(chain.sql).to.equal('select * from "public"."users"');
    });

    it("basic wheres", function() {
      chain = sql().select('*').from('users').where('id', '=', 1);
      expect(chain.toSQL().sql).to.equal('select * from "users" where "id" = ?');
      expect(chain.toSQL().bindings).to.eql([1]);
      expect(chain.toQuery()).to.equal('select * from "users" where "id" = \'1\'');
    });

    it("where betweens", function() {
      chain = sql().select('*').from('users').whereBetween('id', [1, 2]).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" between ? and ?');
      expect(chain.bindings).to.eql([1, 2]);
    });

    it("where betweens, alternate", function() {
      chain = sql().select('*').from('users').where('id', 'BeTween', [1, 2]).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" between ? and ?');
      expect(chain.bindings).to.eql([1, 2]);
    });

    it("where not between", function() {
      chain = sql().select('*').from('users').whereNotBetween('id', [1, 2]).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" not between ? and ?');
      expect(chain.bindings).to.eql([1, 2]);
    });

    it("where not between, alternate", function() {
      chain = sql().select('*').from('users').where('id', 'not between ', [1, 2]).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" not between ? and ?');
      expect(chain.bindings).to.eql([1, 2]);
    });

    it("basic or wheres", function() {
      chain = sql().select('*').from('users').where('id', '=', 1).orWhere('email', '=', 'foo').toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? or "email" = ?');
      expect(chain.bindings).to.eql([1, 'foo']);
    });

    it("raw wheres", function() {
      chain = sql().select('*').from('users').where(raw('id = ? or email = ?', [1, 'foo'])).toSQL();
      expect(chain.sql).to.equal('select * from "users" where id = ? or email = ?');
      expect(chain.bindings).to.eql([1, 'foo']);
    });

    it("raw or wheres", function() {
      chain = sql().select('*').from('users').where('id', '=', 1).orWhere(raw('email = ?', ['foo'])).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? or email = ?');
      expect(chain.bindings).to.eql([1, 'foo']);
    });

    it("basic where ins", function() {
      chain = sql().select('*').from('users').whereIn('id', [1, 2, 3]).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" in (?, ?, ?)');
      expect(chain.bindings).to.eql([1, 2, 3]);
    });

    it("orWhereIn", function() {
      chain = sql().select('*').from('users').where('id', '=', 1).orWhereIn('id', [1, 2, 3]).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? or "id" in (?, ?, ?)');
      expect(chain.bindings).to.eql([1, 1, 2, 3]);
    });

    it("basic where not ins", function() {
      chain = sql().select('*').from('users').whereNotIn('id', [1, 2, 3]).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" not in (?, ?, ?)');
      expect(chain.bindings).to.eql([1, 2, 3]);
    });

    it("or where not in", function() {
      chain = sql().select('*').from('users').where('id', '=', 1).orWhereNotIn('id', [1, 2, 3]).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? or "id" not in (?, ?, ?)');
      expect(chain.bindings).to.eql([1, 1, 2, 3]);
    });

    it('should allow a function as the first argument, for a grouped where clause', function() {
      var partial = sql().table('test').where('id', '=', 1);
      chain = partial.toSQL();
      expect(chain.sql).to.equal('select * from "test" where "id" = ?');

      var subWhere = function(qb) {
        expect(this).to.equal(qb);
        this.where({id: 3}).orWhere('id', 4);
      };
      chain = partial.where(subWhere).toSQL();
      expect(chain.bindings).to.eql([1, 3, 4]);
      expect(chain.sql).to.equal('select * from "test" where "id" = ? and ("id" = ? or "id" = ?)');
    });

    it('should accept a function as the "value", for a sub select', function() {
      chain = sql().where('id', '=', function(qb) {
        expect(this).to.equal(qb);
        this.select('account_id').from('names').where('names.id', '>', 1).orWhere(function() {
          this.where('names.first_name', 'like', 'Tim%').andWhere('names.id', '>', 10);
        });
      });
      var toSql = chain.toSQL();
      expect(toSql.bindings).to.have.length(3);
      expect(chain.toQuery()).to.equal('select * where "id" = (select "account_id" from "names" where "names"."id" > \'1\' or ("names"."first_name" like \'Tim%\' and "names"."id" > \'10\'))');
    });

    it('should not do whereNull on where("foo", "<>", null) #76', function() {
      chain = sql().where('foo', '<>', null);
      expect(chain.toQuery()).to.equal('select * where "foo" <> NULL');
    });

    it('should expand where("foo", "!=") to - where id = "!="', function() {
      chain = sql().where('foo', '!=');
      expect(chain.toQuery()).to.equal('select * where "foo" = \'!=\'');
    });

    it("unions", function() {
      chain = sql().select('*').from('users').where('id', '=', 1);
      chain = chain.union(function() {
        this.select('*').from('users').where('id', '=', 2);
      }).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? union select * from "users" where "id" = ?');
      expect(chain.bindings).to.eql([1, 2]);
    });

    // it("handles grouped mysql unions", function() {
    //   chain = mysql().union(
    //     raw(mysql().select('*').from('users').where('id', '=', 1)).wrap('(', ')'),
    //     raw(mysql().select('*').from('users').where('id', '=', 2)).wrap('(', ')')
    //   ).orderBy('id').limit(10).toSQL();
    //   expect(chain.sql).to.equal('(select * from `users` where `id` = ?) union (select * from `users` where `id` = ?) order by `id` asc limit ?');
    //   expect(chain.bindings).to.eql([1, 2, 10]);
    // });

    it("union alls", function() {
      chain = sql().select('*').from('users').where('id', '=', 1);
      chain = chain.unionAll(function() {
        this.select('*').from('users').where('id', '=', 2);
      }).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? union all select * from "users" where "id" = ?');
      expect(chain.bindings).to.eql([1, 2]);
    });

    it("multiple unions", function() {
      chain = sql().select('*').from('users').where('id', '=', 1);
      chain = chain.union(sql().select('*').from('users').where('id', '=', 2));
      chain = chain.union(sql().select('*').from('users').where('id', '=', 3)).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? union select * from "users" where "id" = ? union select * from "users" where "id" = ?');
      expect(chain.bindings).to.eql([1, 2, 3]);
    });

    it("multiple union alls", function() {
      chain = sql().select('*').from('users').where('id', '=', 1);
      chain = chain.unionAll(sql().select('*').from('users').where('id', '=', 2));
      chain = chain.unionAll(sql().select('*').from('users').where('id', '=', 3)).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? union all select * from "users" where "id" = ? union all select * from "users" where "id" = ?');
      expect(chain.bindings).to.eql([1, 2, 3]);
    });

    it("sub select where ins", function() {
      chain = sql().select('*').from('users').whereIn('id', function(qb) {
        qb.select('id').from('users').where('age', '>', 25).limit(3);
      }).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" in (select "id" from "users" where "age" > ? limit ?)');
      expect(chain.bindings).to.eql([25, 3]);
    });

    it("sub select where not ins", function() {
      chain = sql().select('*').from('users').whereNotIn('id', function(qb) {
        qb.select('id').from('users').where('age', '>', 25).limit(3);
      }).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" not in (select "id" from "users" where "age" > ? limit ?)');
      expect(chain.bindings).to.eql([25, 3]);
    });

    it("basic where nulls", function() {
      chain = sql().select('*').from('users').whereNull('id').toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" is null');
      expect(chain.bindings).to.eql([]);
    });

    it("basic or where nulls", function() {
      chain = sql().select('*').from('users').where('id', '=', 1).orWhereNull('id').toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? or "id" is null');
      expect(chain.bindings).to.eql([1]);
    });

    it("basic where not nulls", function() {
      chain = sql().select('*').from('users').whereNotNull('id').toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" is not null');
      expect(chain.bindings).to.eql([]);
    });

    it("basic or where not nulls", function() {
      chain = sql().select('*').from('users').where('id', '>', 1).orWhereNotNull('id').toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" > ? or "id" is not null');
      expect(chain.bindings).to.eql([1]);
    });

    it("group bys", function() {
      chain = sql().select('*').from('users').groupBy('id', 'email').toSQL();
      expect(chain.sql).to.equal('select * from "users" group by "id", "email"');
    });

    it("order bys", function() {
      chain = sql().select('*').from('users').orderBy('email').orderBy('age', 'desc').toSQL();
      expect(chain.sql).to.equal('select * from "users" order by "email" asc, "age" desc');
    });

    it("havings", function() {
      chain = sql().select('*').from('users').having('email', '>', 1).toSQL();
      expect(chain.sql).to.equal('select * from "users" having "email" > ?');
    });

    it("grouped having", function() {
      chain = sql().select('*').from('users').groupBy('email').having('email', '>', 1).toSQL();
      expect(chain.sql).to.equal('select * from "users" group by "email" having "email" > ?');
    });

    it("having from", function() {
      chain = sql().select('email as foo_email').from('users').having('foo_email', '>', 1).toSQL();
      expect(chain.sql).to.equal('select "email" as "foo_email" from "users" having "foo_email" > ?');
    });

    it("raw havings", function() {
      chain = sql().select('*').from('users').having(raw('user_foo < user_bar')).toSQL();
      expect(chain.sql).to.equal('select * from "users" having user_foo < user_bar');
    });

    it("raw or havings", function() {
      chain = sql().select('*').from('users').having('baz', '=', 1).orHaving(raw('user_foo < user_bar')).toSQL();
      expect(chain.sql).to.equal('select * from "users" having "baz" = ? or user_foo < user_bar');
    });

    it("limits and offsets", function() {
      chain = sql().select('*').from('users').offset(5).limit(10).toSQL();
      expect(chain.sql).to.equal('select * from "users" limit ? offset ?');
      expect(chain.bindings).to.eql([10, 5]);

      // chain = sql().select('*').from('users').offset(-5).take(10);
      // builder = chain.toSQL();
      // expect(chain.sql).to.equal('select * from "users" limit 10 offset 0');

      // chain = sql().select('*').from('users').forPage(2, 15);
      // builder = chain.toSQL();
      // expect(chain.sql).to.equal('select * from "users" limit 15 offset 15');

      // chain = sql().select('*').from('users').forPage(-2, 15);
      // builder = chain.toSQL();
      // expect(chain.sql).to.equal('select * from "users" limit 15 offset 0');
    });

    it("where shortcut", function() {
      chain = sql().select('*').from('users').where('id', 1).orWhere('name', 'foo').toSQL();
      expect(chain.sql).to.equal('select * from "users" where "id" = ? or "name" = ?');
      expect(chain.bindings).to.eql([1, 'foo']);
    });

    it("nested wheres", function() {
      chain = sql().select('*').from('users').where('email', '=', 'foo').orWhere(function(qb) {
        qb.where('name', '=', 'bar').where('age', '=', 25);
      }).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "email" = ? or ("name" = ? and "age" = ?)');
      expect(chain.bindings).to.eql(['foo', 'bar', 25]);
    });

    it("full sub selects", function() {
      chain = sql().select('*').from('users').where('email', '=', 'foo').orWhere('id', '=', function(qb) {
        qb.select(raw('max(id)')).from('users').where('email', '=', 'bar');
      }).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "email" = ? or "id" = (select max(id) from "users" where "email" = ?)');
      expect(chain.bindings).to.eql(['foo', 'bar']);
    });

    it("where exists", function() {
      chain = sql().select('*').from('orders').whereExists(function(qb) {
        qb.select('*').from('products').where('products.id', '=', raw('"orders"."id"'));
      }).toSQL();
      expect(chain.sql).to.equal('select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")');
    });

    it("where exists", function() {
      chain = sql().select('*').from('orders').whereExists(function(qb) {
        qb.select('*').from('products').where('products.id', '=', raw('"orders"."id"'));
      }).toSQL();
      expect(chain.sql).to.equal('select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")');
    });

    it("where not exists", function() {
      chain = sql().select('*').from('orders').whereNotExists(function(qb) {
        qb.select('*').from('products').where('products.id', '=', raw('"orders"."id"'));
      }).toSQL();
      expect(chain.sql).to.equal('select * from "orders" where not exists (select * from "products" where "products"."id" = "orders"."id")');
    });

    it("or where exists", function() {
      chain = sql().select('*').from('orders').where('id', '=', 1).orWhereExists(function(qb) {
        qb.select('*').from('products').where('products.id', '=', raw('"orders"."id"'));
      }).toSQL();
      expect(chain.sql).to.equal('select * from "orders" where "id" = ? or exists (select * from "products" where "products"."id" = "orders"."id")');
    });

    it("or where not exists", function() {
      chain = sql().select('*').from('orders').where('id', '=', 1).orWhereNotExists(function(qb) {
        qb.select('*').from('products').where('products.id', '=', raw('"orders"."id"'));
      }).toSQL();
      expect(chain.sql).to.equal('select * from "orders" where "id" = ? or not exists (select * from "products" where "products"."id" = "orders"."id")');
    });

    it("basic joins", function() {
      chain = sql().select('*').from('users').join('contacts', 'users.id', '=', 'contacts.id').leftJoin('photos', 'users.id', '=', 'photos.id').toSQL();
      expect(chain.sql).to.equal('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" left join "photos" on "users"."id" = "photos"."id"');
    });

    it("complex join", function() {
      chain = sql().select('*').from('users').join('contacts', function(qb) {
        qb.on('users.id', '=', 'contacts.id').orOn('users.name', '=', 'contacts.name');
      }).toSQL();
      expect(chain.sql).to.equal('select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "users"."name" = "contacts"."name"');
    });

    it("raw expressions in select", function() {
      chain = sql().select(raw('substr(foo, 6)')).from('users').toSQL();
      expect(chain.sql).to.equal('select substr(foo, 6) from "users"');
    });

    // it("list methods gets array of column values", function() {
    //   chain = sql().getConnection().shouldReceive('select').once().andReturn(array({foo: 'bar'}, {'foo': 'baz'}));
    //   $builder.getProcessor().shouldReceive('processSelect').once().with($builder, array({foo: 'bar'}, {foo: 'baz'})).andReturnUsing(function($query, $results)
    //   {
    //     return $results;
    //   });
    //   $results = $builder.from('users').where('id', '=', 1).lists('foo');
    //   equal(array('bar', 'baz'), $results);

    // //   chain = sql().getConnection().shouldReceive('select').once().andReturn(array(array('id' => 1, 'foo' => 'bar'), array('id' => 10, 'foo' => 'baz')));
    // //   $builder.getProcessor().shouldReceive('processSelect').once().with($builder, array(array('id' => 1, 'foo' => 'bar'), array('id' => 10, 'foo' => 'baz'))).andReturnUsing(function($query, $results)
    //   {
    //     return $results;
    //   });
    //   $results = $builder.from('users').where('id', '=', 1).lists('foo', 'id');
    // //   equal(array(1 => 'bar', 10 => 'baz'), $results);
    // });

    // it("pluck method returns single column", function() {
    //   chain = sql().getConnection().shouldReceive('select').once().with('select "foo" from "users" where "id" = ? limit 1', [1]).andReturn(array({foo: 'bar'}));
    //   $builder.getProcessor().shouldReceive('processSelect').once().with($builder, array({foo: 'bar'})).andReturn(array({foo: 'bar'}));
    //   $results = $builder.from('users').where('id', '=', 1).pluck('foo');
    //   equal('bar', $results);
    // });

    it("aggregate functions", function() {
      chain = sql().from('users').count().toSQL();
      expect(chain.sql).to.equal('select count(*) from "users"');
    });

    it("aggregate alias", function() {
      chain = sql().from('users').count('* as all').toSQL();
      expect(chain.sql).to.equal('select count(*) as "all" from "users"');
    });

    it("max", function() {
      chain = sql().from('users').max('id').toSQL();
      expect(chain.sql).to.equal('select max("id") from "users"');
    });

    it("min", function() {
      chain = sql().from('users').min('id').toSQL();
      expect(chain.sql).to.equal('select min("id") from "users"');
    });

    it("sum", function() {
      chain = sql().from('users').sum('id').toSQL();
      expect(chain.sql).to.equal('select sum("id") from "users"');
    });

    it("insert method", function() {
      var value = sql().into('users').insert({'email': 'foo'}).toSQL();
      expect(value.sql).to.equal('insert into "users" ("email") values (?)');
      expect(value.bindings).to.eql(['foo']);
    });

    it("SQLite3 multiple inserts", function() {
      chain = sqlite3().from('users').insert([{email: 'foo', name: 'taylor'}, {email: 'bar', name: 'dayle'}]).toSQL();
      expect(chain.sql).to.equal('insert into "users" ("email", "name") select ? as "email", ? as "name" union all select ? as "email", ? as "name"');
      expect(chain.bindings).to.eql(['foo', 'taylor', 'bar', 'dayle']);
    });

    it("insert method respects raw bindings", function() {
      var result = sql().insert({'email': raw('CURRENT TIMESTAMP')}).into('users').toSQL();
      expect(result.sql).to.equal('insert into "users" ("email") values (CURRENT TIMESTAMP)');
    });

    it("normalizes for missing keys in insert", function() {
      var data = [{a: 1}, {b: 2}, {a: 2, c: 3}];
      chain = sql().insert(data).into('table').toSQL();
      assert.deepEqual(chain.bindings, [1, undefined, undefined, undefined, 2, undefined, 2, undefined, 3]);
      assert.equal(chain.sql, 'insert into "table" ("a", "b", "c") values (?, ?, ?), (?, ?, ?), (?, ?, ?)');
    });

    it("update method", function() {
      chain = sql().update({'email': 'foo', 'name': 'bar'}).table('users').where('id', '=', 1).toSQL();
      expect(chain.sql).to.equal('update "users" set "email" = ?, "name" = ? where "id" = ?');
      expect(chain.bindings).to.eql(['foo', 'bar', 1]);
    });

    it("should allow for 'null' updates", function() {
      chain = sql().update({email: null, 'name': 'bar'}).table('users').where('id', 1).toSQL();
      expect(chain.sql).to.equal('update "users" set "email" = ?, "name" = ? where "id" = ?');
      expect(chain.bindings).to.eql([null, 'bar', 1]);
    });

    it("order by, limit", function() {
      chain = mysql().from('users').where('id', '=', 1).orderBy('foo', 'desc').limit(5).update({email: 'foo', name: 'bar'}).toSQL();
      expect(chain.sql).to.equal('update `users` set `email` = ?, `name` = ? where `id` = ? order by `foo` desc limit ?');
      expect(chain.bindings).to.eql(['foo', 'bar', 1, 5]);
    });

    it("update method with joins mysql", function() {
      chain = mysql().from('users').join('orders', 'users.id', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'}).toSQL();
      expect(chain.sql).to.equal('update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` set `email` = ?, `name` = ? where `users`.`id` = ?');
      expect(chain.bindings).to.eql(['foo', 'bar', 1]);
    });

    it("update method without joins on postgres", function() {
      chain = sql().from('users').where('id', '=', 1).update({email: 'foo', name: 'bar'}).toSQL();
      expect(chain.sql).to.equal('update "users" set "email" = ?, "name" = ? where "id" = ?');
      expect(chain.bindings).to.eql(['foo', 'bar', 1]);
    });

    // TODO:
    // it("update method with joins on postgres", function() {
    //   chain = sql().from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({email: 'foo', name: 'bar'}).toSQL();
    //   expect(chain.sql).to.equal('update "users" set "email" = ?, "name" = ? from "orders" where "users"."id" = ? and "users"."id" = "orders"."user_id"');
    //   expect(chain.sql).to.eql(['foo', 'bar', 1]);
    // });

    it("update method respects raw", function() {
      chain = sql().from('users').where('id', '=', 1).update({email: raw('foo'), name: 'bar'}).toSQL();
      expect(chain.sql).to.equal('update "users" set "email" = foo, "name" = ? where "id" = ?');
      expect(chain.bindings).to.eql(['bar', 1]);
    });

    it("delete method", function() {
      chain = sql().from('users').where('email', '=', 'foo').delete().toSQL();
      expect(chain.sql).to.equal('delete from "users" where "email" = ?');
      expect(chain.bindings).to.eql(['foo']);
    });

    it("truncate method", function() {
      chain = mysql().table('users').truncate().toSQL();
      expect(chain.sql).to.equal('truncate `users`');
      chain = sql().table('users').truncate().toSQL();
      expect(chain.sql).to.equal('truncate "users" restart identity');
      chain = sqlite3().table('users').truncate().toSQL();
      expect(chain.sql).to.equal('delete from sqlite_sequence where name = "users"');
      expect(typeof chain.output).to.equal('function');
    });

    it("postgres insert get id", function() {
      chain = sql().from('users').insert({email: 'foo'}, 'id').toSQL();
      expect(chain.sql).to.equal('insert into "users" ("email") values (?) returning "id"', ['foo']);
    });

    it("MySQL wrapping", function() {
      chain = mysql().select('*').from('users').toSQL();
      expect(chain.sql).to.equal('select * from `users`');
    });

    it("SQLite order by", function() {
      chain = sqlite3().select('*').from('users').orderBy('email', 'desc').toSQL();
      expect(chain.sql).to.equal('select * from "users" order by "email" collate nocase desc');
    });

    // it("sql server limits and offsets", function() {
    //   $builder = $this.getSqlServerBuilder();
    //   $builder.select('*').from('users').limit(10).toSQL();
    //   expect(chain.sql).to.equal('select top 10 * from [users]');

    //   $builder = $this.getSqlServerBuilder();
    //   $builder.select('*').from('users').offset(10).toSQL();
    //   expect(chain.sql).to.equal('select * from (select *, row_number() over (order by (select 0)) as row_num from [users]) as temp_table where row_num >= 11');

    //   $builder = $this.getSqlServerBuilder();
    //   $builder.select('*').from('users').offset(10).limit(10).toSQL();
    //   expect(chain.sql).to.equal('select * from (select *, row_number() over (order by (select 0)) as row_num from [users]) as temp_table where row_num between 11 and 20');

    //   $builder = $this.getSqlServerBuilder();
    //   $builder.select('*').from('users').offset(10).limit(10).orderBy('email', 'desc').toSQL();
    //   expect(chain.sql).to.equal('select * from (select *, row_number() over (order by [email] desc) as row_num from [users]) as temp_table where row_num between 11 and 20');
    // });

    it("providing null or false as second parameter builds correctly", function() {
      chain = sql().select('*').from('users').where('foo', null).toSQL();
      expect(chain.sql).to.equal('select * from "users" where "foo" is null');
    });

    it("MySQL lock for update", function (){
      chain = mysql().transacting({}).select('*').from('foo').where('bar', '=', 'baz').forUpdate().toSQL();
      expect(chain.sql).to.equal('select * from `foo` where `bar` = ? for update');
      expect(chain.bindings).to.eql(['baz']);
    });

    it("MySQL lock in share mode", function() {
      chain = mysql().transacting({}).select('*').from('foo').where('bar', '=', 'baz').forShare().toSQL();
      expect(chain.sql).to.equal('select * from `foo` where `bar` = ? lock in share mode');
      expect(chain.bindings).to.eql(['baz']);
    });

    it("should warn when trying to use forUpdate outside of a transaction", function() {
      chain = mysql().select('*').from('foo').where('bar', '=', 'baz').forUpdate().toSQL();
      expect(chain.sql).to.equal('select * from `foo` where `bar` = ?');
      expect(chain.bindings).to.eql(['baz']);
    });

    it("Postgres lock for update", function() {
      chain = sql().transacting({}).select('*').from('foo').where('bar', '=', 'baz').forUpdate().toSQL();
      expect(chain.sql).to.equal('select * from "foo" where "bar" = ? for update');
      expect(chain.bindings).to.eql(['baz']);
    });

    it("Postgres lock for share", function() {
      chain = sql().transacting({}).select('*').from('foo').where('bar', '=', 'baz').forShare().toSQL();
      expect(chain.sql).to.equal('select * from "foo" where "bar" = ? for share');
      expect(chain.bindings).to.eql(['baz']);
    });

    // it("SQLServer lock", function() {
    //   $builder = $this.getSqlServerBuilder();
    //   $builder.select('*').from('foo').where('bar', '=', 'baz').lock().toSQL();
    //   expect(chain.sql).to.equal('select * from [foo] with(rowlock,updlock,holdlock) where [bar] = ?');
    //   expect(chain.bindings).to.eql(array('baz'));

    //   $builder = $this.getSqlServerBuilder();
    //   $builder.select('*').from('foo').where('bar', '=', 'baz').lock(false).toSQL();
    //   expect(chain.sql).to.equal('select * from [foo] with(rowlock,holdlock) where [bar] = ?');
    //   expect(chain.bindings).to.eql(array('baz'));
    // });

    it('allows insert values of sub-select, #121', function() {
      chain = sql().table('entries').insert({
        secret: 123,
        sequence: raw(sql().count('*').from('entries').where('secret', 123)).wrap('(',')')
      }).toSQL();
      expect(chain.sql).to.equal('insert into "entries" ("secret", "sequence") values (?, (select count(*) from "entries" where "secret" = ?))');
      expect(chain.bindings).to.eql([123, 123]);
    });

    it('allows left outer join with raw values', function() {
      chain = sql().select('*').from('student').leftOuterJoin('student_languages', function() {
        this.on('student.id', 'student_languages.student_id').andOn('student_languages.code', raw('?', 'en_US'));
      }).toSQL();
      expect(chain.sql).to.equal('select * from "student" left outer join "student_languages" on "student"."id" = "student_languages"."student_id" and "student_languages"."code" = ?');
    });

    it('should not break with null call #182', function() {
      chain = sql().from('test').limit(null).offset(null).toSQL();
      expect(chain.sql).to.eql('select * from "test"');
    });

    it('allows passing builder into where clause, #162', function() {
      chain    = sql().from('chapter').select('id').where('book', 1);
      var page = sql().from('page').select('id').whereIn('chapter_id', chain);
      var word = sql().from('word').select('id').whereIn('page_id', page);

      var three = chain.clone().del().toSQL();
      var two   = page.clone().del().toSQL();
      var one   = word.clone().del().toSQL();

      expect(one.sql).to.eql('delete from "word" where "page_id" in (select "id" from "page" where "chapter_id" in (select "id" from "chapter" where "book" = ?))');
      expect(one.bindings).to.eql([1]);
      expect(two.sql).to.eql('delete from "page" where "chapter_id" in (select "id" from "chapter" where "book" = ?)');
      expect(two.bindings).to.eql([1]);
      expect(three.sql).to.eql('delete from "chapter" where "book" = ?');
      expect(three.bindings).to.eql([1]);
    });

    it('allows specifying the columns and the query for insert, #211', function() {
      var id = 1;
      var email = 'foo@bar.com';
      chain = sql().into(raw('recipients (recipient_id, email)')).insert(
        sql().select(raw('?, ?', [id, email])).whereNotExists(function() {
          this.select(1).from('recipients').where('recipient_id', id);
        })).toSQL();
      expect(chain.sql).to.equal('insert into recipients (recipient_id, email) select ?, ? where not exists (select 1 from "recipients" where "recipient_id" = ?)');
    });

    it('does an update with join, #191', function() {
      var setObj = {'tblPerson.City': 'Boonesville'};
      var query = mysql().table('tblPerson').update(setObj)
        .join('tblPersonData', 'tblPersonData.PersonId', '=', 'tblPerson.PersonId')
        .where('tblPersonData.DataId', 1)
        .where('tblPerson.PersonId', 5 );

      expect(query.toQuery()).to.equal("update `tblPerson` inner join `tblPersonData` on `tblPersonData`.`PersonId` = `tblPerson`.`PersonId` set `tblPerson`.`City`" +
        " = 'Boonesville' where `tblPersonData`.`DataId` = 1 and `tblPerson`.`PersonId` = 5");
    });

    it('does crazy advanced inserts with clever raw use, #211', function() {
      var q1 = sql().select(raw("'user'"), raw("'user@foo.com'")).whereNotExists(function() {
        this.select(1).from('recipients').where('recipient_id', 1);
      }).toSQL();
      var q2 = sql().table('recipients').insert(raw('(recipient_id, email) ' + q1.sql, q1.bindings));
      expect(q2.toSQL().sql).to.equal('insert into "recipients" (recipient_id, email) select \'user\', \'user@foo.com\' where not exists (select 1 from "recipients" where "recipient_id" = ?)');
    });

    it('throws if you try to use an invalid operator', function() {
      var err;
      try {
        sql().select('*').where('id', 'isnt', 1).toString();
      } catch (e) {
        err = e.message;
      }
      expect(err).to.equal("The operator \"isnt\" is not permitted");
    });

    it('throws if you try to use an invalid operator in an inserted statement', function() {
      var err, obj = sql().select('*').where('id', 'isnt', 1);
      try {
        sql().select('*').from('users').where('id', 'in', obj).toString();
      } catch (e) {
        err = e.message;
      }
      expect(err).to.equal("The operator \"isnt\" is not permitted");
    });

    it("#287 - wraps correctly for arrays", function() {
      var str = sql().select('*').from('value').join('table', 'table.array_column[1]', '=', raw('?', 1)).toString();
      expect(str).to.equal('select * from "value" inner join "table" on "table"."array_column"[1] = \'1\'');
    });

    it('allows wrap on raw to wrap in parens and alias', function() {
      var str = sql().select(
        'e.lastname',
        'e.salary',
        raw(
          sql().select('avg(salary)').from('employee').whereRaw('dept_no = e.dept_no')
        ).wrap('(', ') avg_sal_dept')
      ).from('employee as e')
      .where('dept_no', '=', 'e.dept_no').toString();
      expect(str).to.equal('select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) avg_sal_dept from "employee" as "e" where "dept_no" = \'e.dept_no\'');
    });

  });

};