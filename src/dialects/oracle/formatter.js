import Formatter from '../../formatter';
import { ReturningHelper } from './utils';

export default class Oracle_Formatter extends Formatter {
  alias(first, second) {
    return first + ' ' + second;
  }

  parameter(value, notSetValue) {
    // Returning helper uses always ROWID as string
    if (value instanceof ReturningHelper && this.client.driver) {
      value = new this.client.driver.OutParam(this.client.driver.OCCISTRING);
    } else if (typeof value === 'boolean') {
      value = value ? 1 : 0;
    }
    return super.parameter(value, notSetValue);
  }
}
