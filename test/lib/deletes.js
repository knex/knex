
module.exports = function(Knex, dbName, resolver) {

  it('should delete an item', function(ok) {
    
    Knex('accounts')
      .where({'email':'test2@example.com'})
      .del()
      .then(resolver(ok), ok);

  });

};