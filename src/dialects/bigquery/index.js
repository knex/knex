
// BigQuery Client
// -------
import inherits from 'inherits';

import Client from '../../client';
import Promise from 'bluebird';

import { assign } from 'lodash';
import { makeEscape } from '../../query/string';

const debug = require('debug')('knex:bigquery');

function Client_BigQuery(config) {
  Client.call(this, config);

  this.useBigQueryTypes = config.useBigQueryTypes || false;
}
inherits(Client_BigQuery, Client);

assign(Client_BigQuery.prototype, {

  dialect: 'bigquery',

  driverName: '@google-cloud/bigquery',

  _driver() {
    const BigQuery = require('@google-cloud/bigquery');
    this.bigQueryTypes = [
      BigQuery.date,
      BigQuery.datetime,
      BigQuery.time,
      BigQuery.timestamp
    ];
    return new BigQuery(this.connectionStrings);
  },

  schemaCompiler() {
    throw new Error("schema management not supported by BigQuery");
  },

  transaction() {
    throw new Error("transaction not supported by BigQuery");
  },

  _escapeBinding: makeEscape(),

  wrapIdentifierImpl(value) {
    return (value !== '*' ? `\`${value.replace(/`/g, '\\`')}\`` : '*');
  },

  // wrap the driver with a connection to keep track of the currently running job on the connection
  acquireRawConnection() {
    return Promise.resolve({
      driver: this.driver,
      job: null
    });
  },

  // destroy by cancelling running job, if exists
  destroyRawConnection(connection) {
    if (connection.job != null) {
      return this.cancelQuery(connection);
    } else {
      return Promise.resolve();
    }
  },

  // connection should always be valid
  validateConnection(connection) {
    return Promise.resolve(true);
  },

  // execute the query with pagination
  _stream(connection, obj, stream, options) {
    const initPageQuery = assign({
      maxResults: 10000
    }, options, {
      autoPaginate: true
    });

    const query = assign({
      query: obj.sql,
      params: obj.bindings
    }, obj.options);

    return new Promise((resolver, rejecter) => {
      stream.on('error', (err) => {
        this.cancelQuery(connection);
        rejecter(err);
      });
      stream.on('end', (results) => {
        connection.job = null;
        resolver(results);
      });

      const streamPages = (job, pageQuery) => {
        return job.getQueryResults(pageQuery).then((results) => {
          const rows = results[0],
            nextQuery = results[1];

          this.processResponse({
            response: rows
          }).forEach((row) => {
            stream.write(row);
          });

          if (nextQuery != null) {
            return streamPages(job, nextQuery);
          } else {
            return;
          }
        });
      };

      this._executeQuery(connection, query).then((job) => {
        return streamPages(job, initPageQuery);
      }).catch((err) => {
        stream.emit('error', err);
      }).then(() => {
        stream.end();
      });
    });
  },

  // execute the query with no pagination
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') {
      obj = { sql: obj };
    }

    const query = assign({
      query: obj.sql,
      params: obj.bindings
    }, obj.options);

    return this._executeQuery(connection, query).then((job) => {
      return job.getQueryResults({
        autoPaginate: false
      });
    }).then((results) => {
      connection.job = null;
      obj.response = results[0];
      return obj;
    }, (err) => {
      this.cancelQuery(connection);
      throw err;
    });
  },

  // execute a query and return the job if successful
  _executeQuery(connection, query) {
    query = assign(query, {
      useLegacySql: false
    });

    const out = connection.driver
      .startQuery(query)
      .then((results) => {
        connection.job = results[0];
        debug(`Job ${ connection.job.id } started`);
        return connection.job.promise();
      })
      .then(() => {
        return connection.job.getMetadata();
      })
      .then((metadata) => {
        const errors = metadata[0].status.errors;
        if (errors != null && errors.length > 0) {
          debug(`Job ${ connection.job.id } failed with errors`);
          const error = new Error("Error executing query in BigQuery");
          error.bigQueryErrors = errors;
          throw error;
        }

        debug(`Job ${ connection.job.id } completed`);
        return connection.job;
      });

    return Promise.resolve(out);
  },

  processResponse(obj, runner) {
    const rows = obj.response;
    if (!this.useBigQueryTypes) {
      rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const value = row[key];
          if (value != null && this.bigQueryTypes.includes(value.constructor)) {
            row[key] = value.value;
          }
        });
      });
    }
    if (obj.output) {
      return obj.output.call(runner, rows);
    }
    return rows;
  },

  canCancelQuery: true,

  // cancel running job, if exists
  cancelQuery(connectionToKill) {
    if (connectionToKill.job == null) {
      return Promise.resolve();
    }

    const out = connectionToKill.job.cancel();
    connectionToKill.job = null;
    return Promise.resolve(out);
  }

});

export default Client_BigQuery;
