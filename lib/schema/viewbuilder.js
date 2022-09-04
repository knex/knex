const helpers = require('../util/helpers');
const extend = require('lodash/extend');
const assign = require('lodash/assign');

class ViewBuilder {
  constructor(client, method, viewName, fn) {
    this.client = client;
    this._method = method;
    this._schemaName = undefined;
    this._columns = undefined;
    this._fn = fn;
    this._viewName = viewName;
    this._statements = [];
    this._single = {};
  }

  setSchema(schemaName) {
    this._schemaName = schemaName;
  }

  columns(columns) {
    this._columns = columns;
  }

  as(selectQuery) {
    this._selectQuery = selectQuery;
  }

  checkOption() {
    throw new Error(
      'check option definition is not supported by this dialect.'
    );
  }

  localCheckOption() {
    throw new Error(
      'check option definition is not supported by this dialect.'
    );
  }

  cascadedCheckOption() {
    throw new Error(
      'check option definition is not supported by this dialect.'
    );
  }

  toSQL() {
    if (this._method === 'alter') {
      extend(this, AlterMethods);
    }
    this._fn.call(this, this);
    return this.client.viewCompiler(this).toSQL();
  }
}

const AlterMethods = {
  column(column) {
    const self = this;
    return {
      rename: function (newName) {
        self._statements.push({
          grouping: 'alterView',
          method: 'renameColumn',
          args: [column, newName],
        });
        return this;
      },
      defaultTo: function (defaultValue) {
        self._statements.push({
          grouping: 'alterView',
          method: 'defaultTo',
          args: [column, defaultValue],
        });
        return this;
      },
    };
  },
};

helpers.addQueryContext(ViewBuilder);

ViewBuilder.extend = (methodName, fn) => {
  if (Object.prototype.hasOwnProperty.call(ViewBuilder.prototype, methodName)) {
    throw new Error(
      `Can't extend ViewBuilder with existing method ('${methodName}').`
    );
  }

  assign(ViewBuilder.prototype, { [methodName]: fn });
};

module.exports = ViewBuilder;
