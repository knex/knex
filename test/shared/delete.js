
describe('deletes', function () {

  it("delete from `users` where `email` = 'new_email@gmail.com'", function() {
    DB.table('users')
      .where({
        'email':'new_email@gmail.com'
      })['delete'].then(function (resp) {
        
      });
  });

  it('should alias del to delete', function () {
    DB.table('users')
      .where({'email':'new_email@gmail.com'})
      .del()
      .then(function () {
        
      });
  });

});