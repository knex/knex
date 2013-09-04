(function(define) {

"use strict";

define(function(require, exports) {

  var Helpers = require('../../lib/helpers').Helpers;

  var Client = function(name, options) {};

  Client.prototype = {

  };

  Client.extend = Helpers.extend;

  exports.Client = Client;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);