module.exports = function() {
  var _ = require('lodash');
  return _.extend({}, require('../../../../schema/tablecompiler/types'), {
    floating: 'float',
    double: 'float',
    decimal: 'float',
    timestamp: 'datetime'
  });
};