module.exports = function(knex) {
  var sinon = require('sinon');

  describe('Dialect: ' + knex.client.dialect, function() {

    this.dialect = knex.client.dialect;

    require('./schema')(knex);
    require('./schema/transaction')(knex);
    if (this.dialect === 'postgresql') {
      require('./schema/postgresql')(knex);
    }
    require('./migrate')(knex);
    require('./builder/inserts')(knex);
    require('./builder/selects')(knex);
    require('./builder/unions')(knex);
    require('./builder/joins')(knex);
    require('./builder/aggregate')(knex);
    require('./builder/updates')(knex);
    require('./builder/transaction')(knex);
    require('./builder/deletes')(knex);
    require('./builder/additional')(knex);

    describe('knex.destroy', function() {

      it('should allow destroying the pool with knex.destroy', function() {
        var spy = sinon.spy(knex.client.pool, 'destroy');
        return knex.destroy().then(function() {
          expect(spy).to.be.calledOnce;
          expect(knex.client.pool.genericPool).to.be.undefined;
          return knex.destroy();
        }).then(function() {
          expect(spy).to.be.calledTwice;
          console.log('here');
        });
      });
    });

  });

};
