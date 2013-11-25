// Helpers
// -------
(function(define) {

"use strict";

// Just some common functions needed in multiple places within the library.
define(function(require, exports) {

  var _ = require('lodash');

  var Helpers = exports.Helpers = {

    // Simple deep clone for arrays & objects.
    deepClone: function(obj) {
      if (_.isObject(obj)) return JSON.parse(JSON.stringify(obj));
      return obj;
    },

    // Pick off the attributes from only the current layer of the object.
    skim: function(data) {
      return _.map(data, function(obj) {
        return _.pick(obj, _.keys(obj));
      });
    },

    // The function name says it all.
    capitalize: function(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    },

    // Sorts an object based on the names.
    sortObject: function(obj) {
      return _.sortBy(_.pairs(obj), function(a) {
        return a[0];
      });
    },

    // The standard Backbone.js `extend` method, for some nice
    // "sugar" on proper prototypal inheritance.
    extend: function(protoProps, staticProps) {
      var parent = this;
      var child;

      // The constructor function for the new subclass is either defined by you
      // (the "constructor" property in your `extend` definition), or defaulted
      // by us to simply call the parent's constructor.
      if (protoProps && _.has(protoProps, 'constructor')) {
        child = protoProps.constructor;
      } else {
        child = function(){ return parent.apply(this, arguments); };
      }

      // Add static properties to the constructor function, if supplied.
      _.extend(child, parent, staticProps);

      // Set the prototype chain to inherit from `parent`, without calling
      // `parent`'s constructor function.
      var Surrogate = function(){ this.constructor = child; };
      Surrogate.prototype = parent.prototype;
      child.prototype = new Surrogate;

      // Add prototype properties (instance properties) to the subclass,
      // if supplied.
      if (protoProps) _.extend(child.prototype, protoProps);

      // Set a convenience property in case the parent's prototype is needed
      // later.
      child.__super__ = parent.prototype;

      return child;
    },

    // The `format` function is borrowed from the Node.js `utils` module,
    // since we want to be able to have this functionality on the
    // frontend as well.
    format: function(f) {
      var i;
      if (!_.isString(f)) {
        var objects = [];
        for (i = 0; i < arguments.length; i++) {
          objects.push(inspect(arguments[i]));
        }
        return objects.join(' ');
      }
      i = 1;
      var args = arguments;
      var len = args.length;
      var str = String(f).replace(formatRegExp, function(x) {
        if (x === '%%') return '%';
        if (i >= len) return x;
        switch (x) {
          case '%s': return String(args[i++]);
          case '%d': return Number(args[i++]);
          case '%j':
            try {
              return JSON.stringify(args[i++]);
            } catch (_) {
              return '[Circular]';
            }
            break;
          default:
            return x;
        }
      });
      for (var x = args[i]; i < len; x = args[++i]) {
        if (_.isNull(x) || !_.isObject(x)) {
          str += ' ' + x;
        } else {
          str += ' ' + inspect(x);
        }
      }
      return str;
    }

  };

  // Regex used in the `Helpers.format` function.
  var formatRegExp = /%[sdj%]/g;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);