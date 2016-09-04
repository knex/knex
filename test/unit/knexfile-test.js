/*global expect, describe, it*/

'use strict';

describe('Bad knexfile.js', function() {

  it('should throw an error when a bad client is supplied', function() {
    var knex = require('../../knex');
    expect(function () {
      knex({client: 'badclient'})
    }).to.throw(/Cannot find module '\.\/dialects\/badclient\/index.js'/)
  });

});
