var DB = require('../../index');

describe('Updates', function() {
  
  it("update `users` set `email` = 'new_email@gmail.com' where `id` = 1", function() {
    
    DB.table('users')
      .where('id', '=', 1)
      .update({
        'email':'new_email@gmail.com'
      }, function () {

      });
    
  });

});