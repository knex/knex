/*global describe, it*/

'use strict';

module.exports = function(knex) {

  describe('unions', function() {

    it('handles unions', function() {

      return knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union(function() {
          this.select('*').from('accounts').where('id', 2);
        });

    });

  });

};
