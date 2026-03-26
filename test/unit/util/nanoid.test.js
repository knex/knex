const { nanoid } = require('../../../lib/util/nanoid');

describe('nanoid', () => {
  it('generates id', () => {
    const uuid = nanoid();
    const uuid2 = nanoid();

    expect(uuid.length).toBe(21);
    expect(uuid2.length).toBe(21);
    expect(uuid).not.toBe(uuid2);
  });
});
