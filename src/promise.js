
import Promise from 'bluebird';
import { deprecate } from './helpers';

Promise.prototype.exec = function(cb) {
  deprecate('.exec', '.asCallback')
  return this.asCallback(cb)
};

export default Promise;
