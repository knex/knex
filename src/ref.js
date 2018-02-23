'use strict';

import Raw from './raw';

class Ref extends Raw {
  constructor(client, ref) {
    super(client);

    this.ref     = ref;
    this._schema = null;
  }

  withSchema(schema) {
    this._schema = schema;

    return this;
  }

  toSQL() {
    const string = this._schema
      ? `${this._schema}.${this.ref}`
      : this.ref;

    const sql = this.client.formatter(this).columnize(string);

    this.set(sql, []);

    return super.toSQL(...arguments);
  }
}

export default Ref