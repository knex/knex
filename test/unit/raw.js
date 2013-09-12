var Raw = require('../../lib/raw').Raw;
var Common = require('../../lib/common').Common;

describe('Raw', function () {

  var raw;
  beforeEach(function() {
    raw = new Raw({});
  });

  it('binds the instance to the current query', function() {

  });

  it('returns the value of this.sql on the `toSql` method', function() {
    raw.sql = 'This is a test';
    expect(raw.toSql()).to.equal(raw.sql);
  });

});
