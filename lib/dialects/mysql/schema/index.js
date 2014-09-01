'use strict';

module.exports = function(client) {
  require('./schema')(client);
  require('./table')(client);
  require('./column')(client);
};