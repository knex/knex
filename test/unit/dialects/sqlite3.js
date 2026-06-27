'use strict';

const { expect } = require('chai');
const SQLite3_Client = require('../../../lib/dialects/sqlite3');

const client = new SQLite3_Client({
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: { filename: ':memory:' },
});

describe('sqlite3 unit tests', () => {
  describe('date binding conversion in _query (#5240)', () => {
    function mockConnection(capturedBindings) {
      return {
        run(sql, bindings, cb) {
          capturedBindings.push(...bindings);
          cb.call({ lastID: 1, changes: 1 }, null);
        },
        all(sql, bindings, cb) {
          capturedBindings.push(...bindings);
          cb.call({}, null, []);
        },
      };
    }

    it('converts Date bindings to string on insert', async () => {
      const date = new Date('2022-07-21T03:33:16.112Z');
      const obj = client.queryBuilder().table('t').insert({ ts: date }).toSQL();
      obj.method = 'insert';

      const captured = [];
      await client._query(mockConnection(captured), obj);

      expect(captured[0]).to.be.a('string');
      expect(captured[0]).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('converts Date bindings to string on update', async () => {
      const date = new Date('2022-07-21T03:33:16.112Z');
      const obj = client
        .queryBuilder()
        .table('t')
        .where('id', 1)
        .update({ ts: date })
        .toSQL();
      obj.method = 'update';

      const captured = [];
      await client._query(mockConnection(captured), obj);

      expect(captured[0]).to.be.a('string');
      expect(captured[0]).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('leaves non-Date bindings unchanged', async () => {
      const obj = client
        .queryBuilder()
        .table('t')
        .where('id', 1)
        .update({ name: 'foo', count: 42 })
        .toSQL();
      obj.method = 'update';

      const captured = [];
      await client._query(mockConnection(captured), obj);

      expect(captured).to.include('foo');
      expect(captured).to.include(42);
      expect(captured).to.include(1);
    });
  });
});
