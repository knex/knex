const ColumnBuilder = require('../../../schema/columnbuilder');

class ColumnBuilder_Redshift extends ColumnBuilder {
  constructor() {
    super(...arguments);
  }

  // primary needs to set not null on non-preexisting columns, or fail
  primary() {
    this.notNullable();
    return ColumnBuilder.prototype.primary.apply(this, arguments);
  }

  index() {
    this.client.logger.warn(
      'Redshift does not support the creation of indexes.'
    );
    return this;
  }
}

module.exports = ColumnBuilder_Redshift;
