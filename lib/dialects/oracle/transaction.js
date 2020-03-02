const Transaction = require('../../transaction');
const { isUndefined } = require('lodash');
const debugTx = require('debug')('knex:tx');

module.exports = class Oracle_Transaction extends Transaction {};
