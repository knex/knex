require("mocha-as-promised")();

global.sinon = require("sinon");

var chai = global.chai = require("chai");
chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
chai.should();

global._              = require('underscore');
global.when           = require('when');
global.expect         = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion      = chai.Assertion;
global.assert         = chai.assert;

require('./unit/builder')();