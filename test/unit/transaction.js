module.exports = function(client) {

  var Transaction  = require('../../lib/transaction').Transaction;

  describe('Transaction', function () {

    describe('Constructor', function() {

      it('saves the current client off the knex instance', function() {

        var knex = {client: {name: 'mysql'}};

        var transaction = new Transaction(knex);

        assert(transaction.client).should.eql(knex.client);

      });

    });

  });

};