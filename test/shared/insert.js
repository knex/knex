var DB = require('../../index');

describe('Inserts', function() {
  
  it("insert into `users` `email` = 'new_email@gmail.com' where `id` = 1", function() {
    DB.table('users')
      .insert({
        'email':'new_email@gmail.com'
      }).then(function () {
        
      });
  });

  it('should handle multi inserts', function () {
    DB.table('users')
      .insert([{
        'email':'new_email@gmail.com'
      }, {
        'email':'other_new_email@gmail.com'
      }]).then(function () {
        
      });
  });

});