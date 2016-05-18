
import inherits from 'inherits';
import Formatter from '../../formatter';
import { ReturningHelper } from './utils';

import { assign } from 'lodash'

function Oracle_Formatter(client) {
  Formatter.call(this, client)
}
inherits(Oracle_Formatter, Formatter)

assign(Oracle_Formatter.prototype, {

  alias(first, second) {
    return first + ' ' + second;
  },

  parameter(value, notSetValue) {
    // Returning helper uses always ROWID as string
    if (value instanceof ReturningHelper && this.client.driver) {
      value = new this.client.driver.OutParam(this.client.driver.OCCISTRING)
    }
    else if (typeof value === 'boolean') {
      value = value ? 1 : 0
    }
    return Formatter.prototype.parameter.call(this, value, notSetValue)
  }

})

export default Oracle_Formatter
