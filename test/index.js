/*global describe*/

'use strict';

global.sinon = require("sinon");

var chai = global.chai = require("chai");

chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
chai.should();

var Promise = global.testPromise = require('../lib/promise');
global.expect         = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion      = chai.Assertion;
global.assert         = chai.assert;
global.d = new Date();

Promise.longStackTraces();

require('./unit/query/builder')
require('./unit/schema/mysql')

// describe('Unit tests', function() {
//   Object.keys(clients).forEach(function (clientName) {
//     require('./unit/schema/' + (clients[clientName].alias || clients[clientName].name))(clients[clientName].client);
//     require('./unit/query/builder')(function () { return new clients[clientName].client.QueryBuilder(); }, clients[clientName].name, clients[clientName].alias);
//   });
// });

// // Integration Tests
// describe('Integration Tests', function() {
//   require('./integration')(this);
// });
