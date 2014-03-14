// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
module.exports = function(Target) {
  var _ = require('lodash');
  _.each(['catch', 'otherwise', 'tap', 'yield', 'ensure', 'nodeify', 'exec'], function(method) {
    Target.prototype[method] = function() {
      var then = this.then();
      return then[method].apply(then, arguments);
    };
  });
};