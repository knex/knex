const chai = (global.chai = require('chai'));

chai.should();
chai.use(require('chai-as-promised'));

global.expect = chai.expect;
