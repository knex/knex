const chai = require('chai');

let isInitted = false;

if (!isInitted) {
  chai.use(require('chai-as-promised'));
  chai.use(require('sinon-chai'));

  isInitted = true;
}
