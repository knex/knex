module.exports = function(client) {

  var Raw  = require('../../lib/raw').Raw;

  describe('Raw', function () {

    it('has the Common methods mixed-in to the Builder.prototype', function() {
      _.each(Common, function(val, key) {
        expect(Builder.prototype[key]).to.equal(val);
      });
    });

  });

};