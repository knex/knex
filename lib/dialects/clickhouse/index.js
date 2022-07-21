// Clickhouse
// -------

const Client = require('../../client');
const map = require('lodash/map');
const defaults = require('lodash/defaults');
const QueryCompiler = require('./query/clickhouse-querycompiler');
const QueryBuilder = require('./query/clickhouse-querybuilder');
const Val = require('./val');

class Client_Clickhouse extends Client {
  constructor(config) {
    super(config);
  }

  poolDefaults() {
    return defaults({ min: 1, max: 1 }, super.poolDefaults());
  }

  _driver() {
    const { ClickHouse } = require('clickhouse');
    return ClickHouse;
  }

  queryCompiler() {
    return new QueryCompiler(this, ...arguments);
  }

  queryBuilder() {
    return new QueryBuilder(this);
  }

  acquireRawConnection() {
    return new Promise((resolve, reject) => {
      const Driver = this._driver();
      const connection = new Driver(this.connectionSettings);
      resolve(connection);
    });
  }

  async _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    if (obj.method === 'select') {
      const params = this._formatParams(obj.bindings);
      obj.response = await connection
        .query(obj.sql, {
          params,
        })
        .toPromise();
    }

    if (obj.method === 'insert') {
      obj.response = await connection
        .insert(obj.sql, obj.insertData)
        .toPromise();
    }

    return obj;
  }

  positionBindings(sql) {
    let questionCount = 0;
    return sql.replace(/(\\*)(\?)/g, function (match, escapes) {
      if (escapes.length % 2) {
        return '?';
      } else {
        questionCount++;
        return `p${questionCount}`;
      }
    });
  }

  _formatParams(bindings) {
    return bindings.reduce((a, v, i) => {
      return { ...a, ['p' + ++i]: v };
    }, {});
  }

  processResponse(obj, runner) {
    const resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
    if (obj.method === 'raw') return resp;
    const { returning } = obj;
    if (resp.command === 'SELECT') {
      if (obj.method === 'first') return resp.rows[0];
      if (obj.method === 'pluck') return map(resp.rows, obj.pluck);
      return resp.rows;
    }
    if (returning) {
      const returns = [];
      for (let i = 0, l = resp.rows.length; i < l; i++) {
        const row = resp.rows[i];
        returns[i] = row;
      }
      return returns;
    }
    if (resp.command === 'UPDATE' || resp.command === 'DELETE') {
      return resp.rowCount;
    }
    return resp;
  }

  val() {
    return new Val(this).set(...arguments);
  }
}

Object.assign(Client_Clickhouse.prototype, {
  dialect: 'clickhouse',
  driverName: 'clickhouse',
});

module.exports = Client_Clickhouse;
