import ColumnBuilder from '../../../schema/columnbuilder';

import { toArray } from 'lodash';

class ColumnBuilder_Oracle extends ColumnBuilder {
  // checkIn added to the builder to allow the column compiler to change the
  // order via the modifiers ("check" must be after "default")
  checkIn() {
    this._modifiers.checkIn = toArray(arguments);
    return this;
  }
}

export default ColumnBuilder_Oracle;
