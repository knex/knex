const Knex = require('../../lib/index');
const { expect } = require('chai');

describe('knex', () => {
  it('throws error on unsupported config client value', () => {
    expect(() => {
      Knex({
        client: 'dummy',
      });
    }).to.throw(
      /Unknown configuration option 'client' value dummy. Note that it is case-sensitive, check documentation for supported values/
    );
  });

  it('accepts supported config client value', () => {
    expect(() => {
      Knex({
        client: 'mysql',
      });
    }).not.to.throw();
  });

  it('accepts supported config client value alias', () => {
    expect(() => {
      Knex({
        client: 'sqlite',
      });
    }).not.to.throw();
  });
});
