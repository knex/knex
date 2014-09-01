'use strict';

// FunctionHelper
// -------
module.exports = {

  now: function() {
    return new this.client.Raw('CURRENT_TIMESTAMP');
  }

};