const { nanoid } = require('../../../lib/util/nanoid');
const { expect } = require('chai');

describe('nanoid', () => {
  it('generates id', () => {
    const uuid = nanoid();
    const uuid2 = nanoid();

    expect(uuid.length).to.equal(21);
    expect(uuid2.length).to.equal(21);
    expect(uuid).not.to.equal(uuid2);
  });
});
