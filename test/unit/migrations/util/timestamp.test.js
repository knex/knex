const { yyyymmddhhmmss } = require('../../../../lib/migrations/util/timestamp');

describe('timestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: new Date('2007-03-01T13:00:00Z'),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('yyyymmddhhmmss', () => {
    it('Returns UTC time', () => {
      const timestamp = yyyymmddhhmmss();
      expect(timestamp).toBe('20070301130000');
    });
  });
});
