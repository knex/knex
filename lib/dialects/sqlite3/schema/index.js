module.exports = function(client) {
  require('./ddl')(client);
  require('./schema')(client);
  require('./table')(client);
  require('./column')(client);
};