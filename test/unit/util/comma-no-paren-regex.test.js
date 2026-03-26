const { COMMA_NO_PAREN_REGEX } = require('../../../lib/constants');

describe('COMMA_NO_PAREN Regex', () => {
  it('Splits string on commas, excluding those wrapped in parentheses', () => {
    const source = `id integer, external_id integer, name string, body text, PRIMARY KEY (id, external_id)`;

    const result = source.split(COMMA_NO_PAREN_REGEX);

    expect(result).toEqual([
      'id integer',
      'external_id integer',
      'name string',
      'body text',
      'PRIMARY KEY (id, external_id)',
    ]);
  });
});
