'use strict';
/*global expect, describe, it*/
const {
  getCharsetAndCollation,
} = require('../../../lib/dialects/mysql/schema/charset-handler');
const chai = require('chai');

describe('getCharsetAndCollation', function() {
  it('works', function() {
    chai
      .expect(getCharsetAndCollation({}, { charset: 'utf8mb4' }, 'mysql'))
      .to.deep.equal({
        charset: 'UTF8MB4',
        collation: 'UTF8MB4_GENERAL_CI',
      });
    chai
      .expect(
        getCharsetAndCollation({}, { charset: 'utf8mb4_unicode_ci' }, 'mysql')
      )
      .to.deep.equal({
        charset: 'UTF8MB4',
        collation: 'UTF8MB4_UNICODE_CI',
      });
  });
});
