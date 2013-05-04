var Q = require('q');
module.exports = function(Knex, item, handler, type) {

  it('should delete an item', function(ok) {
    
    Knex('accounts')
      .where({'email':'test2@example.com'})
      .del()
      .then(handler(ok), ok);
  
  });

};