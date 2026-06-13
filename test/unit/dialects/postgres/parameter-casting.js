const { expect } = require('chai');
const Knex = require('../../../../lib');

describe('PostgreSQL Parameter Casting', () => {
  let knex;
  let knexNoCast;
  
  before(() => {
    knex = Knex({
      client: 'pg',
      // useNumericCasting: true is default
    });
    
    knexNoCast = Knex({
      client: 'pg',
      useNumericCasting: false
    });
  });
  
  describe('Raw queries', () => {
    it('should add casting for integers in raw queries', () => {
      const raw = knex.raw('SELECT ?', [42]);
      const native = raw.toSQL().toNative();
      expect(native.sql).to.equal('SELECT $1::smallint');
      expect(native.bindings).to.deep.equal([42]);
    });
    
    it('should add casting for floats in raw queries', () => {
      const raw = knex.raw('SELECT ?', [3.14]);
      const native = raw.toSQL().toNative();
      expect(native.sql).to.equal('SELECT $1::numeric');
      expect(native.bindings).to.deep.equal([3.14]);
    });
    
    it('should handle generate_series case', () => {
      const raw = knex.raw('SELECT * FROM generate_series(?, ?, ?)', [1, 20, 1]);
      const native = raw.toSQL().toNative();
      expect(native.sql).to.equal('SELECT * FROM generate_series($1::smallint, $2::smallint, $3::smallint)');
    });
    
    it('should handle substring case', () => {
      const raw = knex.raw('SELECT substring(??, ?)', ['path', 5]);
      const native = raw.toSQL().toNative();
      expect(native.sql).to.contain('$1::smallint');
    });
    
    it('should not cast non-numeric values', () => {
      const raw = knex.raw('SELECT ?, ?', ['string', null]);
      const native = raw.toSQL().toNative();
      expect(native.sql).to.equal('SELECT $1, $2');
      expect(native.bindings).to.deep.equal(['string', null]);
    });
    
    it('should respect different integer ranges', () => {
      const small = knex.raw('SELECT ?', [100]);
      const regular = knex.raw('SELECT ?', [100000]);
      const big = knex.raw('SELECT ?', [9007199254740991]);
      
      expect(small.toSQL().toNative().sql).to.contain('::smallint');
      expect(regular.toSQL().toNative().sql).to.contain('::integer');
      expect(big.toSQL().toNative().sql).to.contain('::bigint');
    });
  });
  
  describe('Query builder', () => {
    it('should add casting in WHERE clauses', () => {
      const query = knex('users').where('id', 5);
      const sql = query.toSQL();
      expect(sql.sql).to.contain('?::smallint');
      expect(sql.bindings).to.deep.equal([5]);
    });
    
    it('should add casting for multiple WHERE conditions', () => {
      const query = knex('users')
        .where('id', 5)
        .where('age', '>', 18)
        .where('score', 3.5);
      
      const sql = query.toSQL();
      expect(sql.sql).to.contain('?::smallint');
      expect(sql.sql).to.contain('?::numeric');
    });
    
    it('should add casting in INSERT statements', () => {
      const query = knex('users').insert({ id: 5, name: 'John', score: 3.5 });
      const sql = query.toSQL();
      
      // Check that numeric values get casting
      const nativeSql = query.toSQL().toNative().sql;
      expect(nativeSql).to.contain('::smallint'); // for id
      expect(nativeSql).to.contain('::numeric');  // for score
    });
  });
  
  describe('Backwards compatibility', () => {
    it('should not add casting when disabled', () => {
      const raw = knexNoCast.raw('SELECT ?', [42]);
      const native = raw.toSQL().toNative();
      expect(native.sql).to.equal('SELECT $1');
      expect(native.bindings).to.deep.equal([42]);
    });
    
    it('should not add casting for query builder when disabled', () => {
      const query = knexNoCast('users').where('id', 5);
      const sql = query.toSQL();
      expect(sql.sql).to.not.contain('::');
    });
  });
  
  describe('Edge cases', () => {
    it('should not cast NaN or Infinity', () => {
      const raw = knex.raw('SELECT ?, ?', [NaN, Infinity]);
      const native = raw.toSQL().toNative();
      expect(native.sql).to.equal('SELECT $1, $2');
    });
    
    it('should handle mixed types correctly', () => {
      const raw = knex.raw('SELECT ?, ?, ?, ?, ?', [
        42,        // integer
        3.14,      // float
        'text',    // string
        true,      // boolean
        null       // null
      ]);
      
      const native = raw.toSQL().toNative();
      expect(native.sql).to.equal('SELECT $1::smallint, $2::numeric, $3, $4, $5');
    });
  });
});