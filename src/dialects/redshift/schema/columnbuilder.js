'use strict';

import ColumnBuilder from '../../../schema/columnbuilder';

class ColumnBuilder_Redshift extends ColumnBuilder {
  // primary needs to set not null on non-preexisting columns, or fail
  primary(...args) {
    this.notNullable();
    super.primary(...args);
  }

  index() {
    this.client.logger.warn(
      'Redshift does not support the creation of indexes.'
    );
    return this;
  }
}

export default ColumnBuilder_Redshift;
