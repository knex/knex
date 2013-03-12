var DB = require('../index').Knex;

describe('Selects', function () {

  it('select * from `u` where `id` > 1', function () {
    DB.table('u')
      .where('id', '>', 1)
      .get()
      .then(function () {
        console.log(this);
        console.log(arguments);
        
      });
  });

});
