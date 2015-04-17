'use strict';

// Oracle Client
// -------
var inherits = require('inherits');
var Oracle   = require('../oracle');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_StrongOracle() {
  Oracle.apply(this, arguments);
}
inherits(Client_StrongOracle, Oracle);

// Lazy-load the strong-oracle dependency, since we might just be
// using the client to generate SQL strings.
Client_StrongOracle.prototype.initDriver = function() {
  Client_StrongOracle.prototype.driver = Client_StrongOracle.prototype.driver ||
    require('strong-oracle')();
};

module.exports = Client_StrongOracle;
