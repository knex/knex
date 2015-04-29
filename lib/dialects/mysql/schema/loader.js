'use strict';

module.exports = function(client) {

  var SchemaLoader = require('../../../schema/loader');
  var inherits = require('inherits');

  function SchemaLoader_MySQL() {
    this.client = client;
    SchemaLoader.apply(this, arguments);
  }
  inherits(SchemaLoader_MySQL, SchemaLoader);

  client.SchemaLoader = SchemaLoader_MySQL;

};
