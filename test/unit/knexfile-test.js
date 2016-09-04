/*global expect, describe, it, beforeEach, afterEach*/

'use strict';

// const sinon = require('sinon')

describe('Bad knexfile.js', function() {
  // let sandbox

  // beforeEach(function() {
  //   sandbox = sinon.sandbox.create()
  // });

  // afterEach(function() {
  //   sandbox.restore()
  // })

  it('should throw an error when a bad client is supplied', function() {
    // sandbox.stub(console, 'log')
    const knex = require('../../knex');
    expect(function () {
      knex({client: 'badclient'})
    })
    .to.throw(/Cannot find module '\.\/dialects\/badclient\/index.js'/)
    // expect(console.log.calledOnce).to.be.true;
    // expect(console.log.calledWith(
    //   `Client or dialect provided, "badclient", ` +
    //   `to the knex configuration was not found. ` +
    //   `Did you make a typo? ` +
    //   `Example dialects: "maria", "pg", etc.`)
    // ).to.be.true;
  });

});
