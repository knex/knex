'use strict';
/*global expect, describe, it*/
const Client = require("../../lib/client");
const chai = require("chai");

describe('client', function () {
  it('should append error details when available', async () => {
    const client = new Client({ client: {} })
    client._query = () => {
      const err = new Error('error message')
      err.detail = 'hmm very tasty details'
      return Promise.reject(err)
    }
    try {
      await client.query('select * from a', {sql: 'select * from a', bindings: []})
    } catch (err) {
      chai.expect(err.message).to.equal('select * from a - error message\nDetail: hmm very tasty details')
    }
  })

  it('should not append error details when not available', async () => {
    const client = new Client({ client: {} })
    client._query = () => {
      const err = new Error('error message')
      return Promise.reject(err)
    }
    try {
      await client.query('select * from a', {sql: 'select * from a', bindings: []})
    } catch (err) {
      chai.expect(err.message).to.equal('select * from a - error message')
    }
  })

})