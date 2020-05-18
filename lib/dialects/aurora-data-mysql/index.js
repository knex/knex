// AWS Aurora MySQL Data API Client
// -------
const Client_MySQL = require('../mysql');
const Transaction = require('./transaction');

function getAuroraDataValue(value) {
  if ('blobValue' in value) {
    return Buffer.from(value.blobValue, 'base64');
  } else if ('booleanValue' in value) {
    return value.booleanValue;
  } else if ('doubleValue' in value) {
    return value.doubleValue;
  } else if ('isNull' in value) {
    return null;
  } else if ('longValue' in value) {
    return value.longValue;
  } else if ('stringValue' in value) {
    return value.stringValue;
  } else {
    const type = Object.keys(value)[0];
    throw new Error(`Unknown value type '${type}' from row`);
  }
}

function hydrateRecord(record, fields) {
  return record.reduce((row, value, index) => {
    const field = fields[index];

    value = getAuroraDataValue(value);

    switch (field.typeName) {
      case 'DECIMAL':
        value = Number(value);
        break;

      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
      case 'YEAR':
        value = new Date(value + 'Z');
        break;

      case 'CHAR':
        if (field.precision === 5) {
          // ENUM ?
          break;
        } else if (field.precision === 13) {
          // SET ?
          value = new Set(value.split(','));
        }
        break;

      default:
        break;
    }

    row[field.name] = value;

    return row;
  }, {});
}

class Client_AuroraDataMySQL extends Client_MySQL {
  transaction() {
    return new Transaction(this, ...arguments);
  }

  _driver() {
    const RDSDataService = require('aws-sdk/clients/rdsdataservice');

    return new RDSDataService(this.config.connection.sdkConfig);
  }

  acquireRawConnection() {
    return {
      client: this.driver,
      parameters: {
        // common parameters for Data API requests
        database: this.config.connection.database,
        resourceArn: this.config.connection.resourceArn,
        secretArn: this.config.connection.secretArn,
      },
    };
  }

  destroyRawConnection(connection) {}

  validateConnection(connection) {
    return true;
  }

  prepBindings(bindings) {
    return bindings.map((value, index) => {
      const name = index.toString();

      switch (typeof value) {
        case 'undefined':
          throw new Error('Binding value cannot be `undefined`');

        case 'boolean':
          return {
            name,
            value: {
              booleanValue: value,
            },
          };

        case 'number':
          if (Number.isInteger(value)) {
            return {
              name,
              value: {
                longValue: value,
              },
            };
          } else {
            return {
              name,
              typeHint: 'DECIMAL',
              value: {
                stringValue: value.toString(),
              },
            };
          }

        case 'string':
          return {
            name,
            value: {
              stringValue: value,
            },
          };

        case 'object':
          break;

        default:
          throw new Error(
            `Unknown binding value type '${typeof value}' for value ${value}`
          );
      }

      if (value === null) {
        return {
          name,
          value: {
            isNull: true,
          },
        };
      }

      if (Buffer.isBuffer(value) || ArrayBuffer.isView(value)) {
        return {
          name,
          value: {
            blobValue: value,
          },
        };
      }

      if (value instanceof Date) {
        return {
          name,
          typeHint: 'TIMESTAMP',
          value: {
            stringValue: value.toISOString().replace('T', ' ').replace('Z', ''),
          },
        };
      }

      if (value instanceof Set) {
        return {
          name,
          value: {
            stringValue: Array.from(value).join(','),
          },
        };
      }

      throw new Error(
        `Unknown binding value object of class '${value.constructor.name}' for value ${value}`
      );
    });
  }

  positionBindings(sql) {
    let questionCount = 0;
    return sql.replace(/\?/g, function () {
      return `:${questionCount++}`;
    });
  }

  _stream(connection, obj, stream, options) {
    throw new Error(
      'Streams are not supported by the aurora-data-mysql dialect'
    );
  }

  async _query(connection, obj) {
    obj.data = await connection.client
      .executeStatement({
        ...connection.parameters,
        includeResultMetadata: true,
        sql: obj.sql,
        parameters: obj.bindings,
      })
      .promise();

    return obj;
  }

  processResponse(resp, runner) {
    if (resp == null) {
      return;
    }

    const { method, data } = resp;
    const {
      columnMetadata: fields,
      generatedFields,
      numberOfRecordsUpdated,
      records,
    } = data;

    const rows = records
      ? records.map((record) => hydrateRecord(record, fields))
      : [];

    if (resp.output) {
      return resp.output.call(runner, rows, fields);
    }

    switch (method) {
      case 'select':
      case 'pluck':
      case 'first': {
        if (method === 'pluck') {
          return rows.map(resp.pluck);
        }
        return method === 'first' ? rows[0] : rows;
      }
      case 'insert':
        return [getAuroraDataValue(generatedFields[0])];
      case 'del':
      case 'update':
      case 'counter':
        return numberOfRecordsUpdated;
      default:
        return { rows, fields };
    }
  }
}

Client_AuroraDataMySQL.prototype.driverName = 'aurora-data-mysql';

module.exports = Client_AuroraDataMySQL;
