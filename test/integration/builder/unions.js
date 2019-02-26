/*global describe, it*/

'use strict';

module.exports = function(knex) {
  describe('unions', function() {
    it('handles unions with a callback', function() {
      return knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union(function() {
          this.select('*')
            .from('accounts')
            .where('id', 2);
        });
    });

    it('handles unions with an array of callbacks', function() {
      return knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union([
          function() {
            this.select('*')
              .from('accounts')
              .where('id', 2);
          },
          function() {
            this.select('*')
              .from('accounts')
              .where('id', 3);
          },
        ]);
    });

    it('handles unions with a list of callbacks', function() {
      return knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union(
          function() {
            this.select('*')
              .from('accounts')
              .where('id', 2);
          },
          function() {
            this.select('*')
              .from('accounts')
              .where('id', 3);
          }
        );
    });

    it('handles unions with an array of builders', function() {
      return knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union([
          knex
            .select('*')
            .from('accounts')
            .where('id', 2),
          knex
            .select('*')
            .from('accounts')
            .where('id', 3),
        ]);
    });

    it('handles unions with a list of builders', function() {
      return knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union(
          knex
            .select('*')
            .from('accounts')
            .where('id', 2),
          knex
            .select('*')
            .from('accounts')
            .where('id', 3)
        );
    });

    it('handles unions with a raw query', function() {
      return knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union(
          knex.raw('select * from ?? where ?? = ?', ['accounts', 'id', 2])
        );
    });

    it('handles unions with an array raw queries', function() {
      return knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union([
          knex.raw('select * from ?? where ?? = ?', ['accounts', 'id', 2]),
          knex.raw('select * from ?? where ?? = ?', ['accounts', 'id', 3]),
        ]);
    });

    it('handles unions with a list of raw queries', function() {
      return knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union(
          knex.raw('select * from ?? where ?? = ?', ['accounts', 'id', 2]),
          knex.raw('select * from ?? where ?? = ?', ['accounts', 'id', 3])
        );
    });
  });
};
