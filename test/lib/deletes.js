var Q = require('q');
module.exports = function(Knex, item, handler, type) {

  it('should delete an item', function(ok) {
    
    Knex('users')
      .where({'email':'new_email@gmail.com'})
      .del()
      .then(handler(ok), ok);
  
  });

};