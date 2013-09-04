(function(define) {

"use strict";

define(function(require, exports) {

  var when = require('when');
  var _    = require('underscore');

  var transaction = function(container) {

    var client = this.client;

    return client.startTransaction().then(function(connection) {

      // Initiate a deferred object, so we know when the
      // transaction completes or fails, we know what to do.
      var dfd = when.defer();

      // The object passed around inside the transaction container.
      var containerObj = {
        commit: function(val) {
          client.finishTransaction('commit', this, dfd, val);
        },
        rollback: function(err) {
          client.finishTransaction('rollback', this, dfd, err);
        },
        // "rollback to"?
        connection: connection
      };

      // Ensure the transacting object methods are bound with the correct context.
      _.bindAll(containerObj, 'commit', 'rollback');

      // Call the container with the transaction
      // commit & rollback objects.
      container(containerObj);

      return dfd.promise;
    });
  };

  exports.transaction = transaction;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports, module); }
);