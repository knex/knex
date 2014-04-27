module.exports = function(knex) {

  describe('Dialect: ' + knex.client.dialect, function() {

    this.dialect = knex.client.dialect;

    require('./schema')(knex);
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
  });

};