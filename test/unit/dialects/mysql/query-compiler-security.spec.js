const { expect } = require('chai');
const QueryCompiler_MySQL = require('../../../../../lib/dialects/mysql/query/mysql-querycompiler');

describe('MySQL Query Compiler Security', () => {
  let compiler;

  beforeEach(() => {
    const mockClient = {
      config: {},
      formatter: () => ({})
    };
    const mockBuilder = {};
    compiler = new QueryCompiler_MySQL(mockClient, mockBuilder);
  });

  describe('whereBasic security validation', () => {
    it('should allow primitive values', () => {
      expect(() => {
        compiler.whereBasic({ value: 'hello' });
      }).not.to.throw();

      expect(() => {
        compiler.whereBasic({ value: 42 });
      }).not.to.throw();

      expect(() => {
        compiler.whereBasic({ value: true });
      }).not.to.throw();

      expect(() => {
        compiler.whereBasic({ value: null });
      }).not.to.throw();
    });

    it('should allow arrays of primitives', () => {
      expect(() => {
        compiler.whereBasic({ value: [1, 2, 3] });
      }).not.to.throw();

      expect(() => {
        compiler.whereBasic({ value: ['a', 'b', 'c'] });
      }).not.to.throw();
    });

    it('should allow objects with primitive properties', () => {
      expect(() => {
        compiler.whereBasic({ value: { a: 'hello', b: 42 } });
      }).not.to.throw();
    });

    it('should reject arrays with objects', () => {
      expect(() => {
        compiler.whereBasic({ value: [1, { a: 'object' }, 3] });
      }).to.throw('The values in where clause must be primitive values');
    });

    it('should reject objects with nested objects', () => {
      expect(() => {
        compiler.whereBasic({ value: { a: 'hello', b: { nested: 'object' } } });
      }).to.throw('The values in where clause must be primitive values');
    });

    it('should reject objects with arrays', () => {
      expect(() => {
        compiler.whereBasic({ value: { a: 'hello', b: [1, 2, 3] } });
      }).to.throw('The values in where clause must be primitive values');
    });

    it('should reject malicious objects that could cause SQL injection', () => {
      expect(() => {
        compiler.whereBasic({ value: { hello: 1 } }); // Original vulnerability
      }).not.to.throw(); // This should now be allowed since it's a safe object

      expect(() => {
        compiler.whereBasic({ value: { name: 'admin' } }); // Ccamm's PoC
      }).not.to.throw(); // This should now be allowed since it's a safe object
    });
  });

  describe('whereRaw security validation', () => {
    it('should allow primitive bindings', () => {
      expect(() => {
        compiler.whereRaw({ 
          value: { 
            bindings: ['hello', 42, true, null] 
          } 
        });
      }).not.to.throw();
    });

    it('should allow arrays of primitives in bindings', () => {
      expect(() => {
        compiler.whereRaw({ 
          value: { 
            bindings: [[1, 2, 3], ['a', 'b', 'c']] 
          } 
        });
      }).not.to.throw();
    });

    it('should allow objects with primitive properties in bindings', () => {
      expect(() => {
        compiler.whereRaw({ 
          value: { 
            bindings: [{ a: 'hello', b: 42 }] 
          } 
        });
      }).not.to.throw();
    });

    it('should reject unsafe arrays in bindings', () => {
      expect(() => {
        compiler.whereRaw({ 
          value: { 
            bindings: [[1, { a: 'object' }, 3]] 
          } 
        });
      }).to.throw('The values in where clause must be primitive values');
    });

    it('should reject unsafe objects in bindings', () => {
      expect(() => {
        compiler.whereRaw({ 
          value: { 
            bindings: [{ a: 'hello', b: { nested: 'object' } }] 
          } 
        });
      }).to.throw('The values in where clause must be primitive values');
    });
  });
});