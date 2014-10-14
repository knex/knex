/*global describe, expect, it, testPromise*/

'use strict';

module.exports = function(knex) {

  var _ = require('lodash');

  describe('Domain', function () {
    it('should keep domain during connections requests', function (done) {
      testPromise.all(_.range(1, 20).map(function (index) {
        var domain = require('domain').create();
        domain.data = index;
        return domain.run(function () {
          return knex('accounts')
          .select()
          .limit(1)
          .bind({ index: index })
          .then(function () {
            expect(this.index).to.equal(process.domain.data);
            process.domain.exit();
          });
        });
      }))
      .then(function () {
        process.domain.exit();
        done();
      })
      .catch(function (err) {
        while (!! process.domain) process.domain.exit();
        done(err);
      });
    });

    it('should not bound previous domains to connections', function (done) {
        return knex('accounts')
        .select()
        .limit(1)
        .then(function () {
          expect(process).to.not.have.property('domain');
          done();
        })
        .catch(done);
    });
  });
};
