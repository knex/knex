const sinon = require('sinon');
const { expect } = require('chai');
const { yyyymmddhhmmss } = require('../../../../lib/migrations/util/timestamp');

describe('timestamp', () => {
  let clock;
  beforeEach(() => {
    clock = sinon.useFakeTimers({
      now: new Date('2007-03-01T13:00:00Z'),
    });
  });

  afterEach(() => {
    sinon.restore();
    clock.restore();
  });

  describe('yyyymmddhhmmss', () => {
    it('Returns UTC time', () => {
      const timestamp = yyyymmddhhmmss();
      expect(timestamp).to.equal('20070301130000');
    });
  });
});
