const { expect } = require('chai');
const Formatter = require('../../../lib/formatter');
const Client = require('../../../lib/client');

describe('formatter', () => {
  const queryContext = () => {
    return {};
  };
  const client = new Client({ client: 'generic' });
  const formatter = new Formatter(client, { queryContext });

  it('correctly handles single column value', () => {
    const columns = formatter.columnize('columnName');
    expect(columns).to.equal('"columnName"');
  });

  it('correctly handles multiple column values', () => {
    const columns = formatter.columnize(['columnName1', 'columnName2']);
    expect(columns).to.equal('"columnName1", "columnName2"');
  });

  it('correctly handles null', () => {
    const columns = formatter.columnize(null);
    expect(columns).to.equal('');
  });

  it('correctly handles empty array', () => {
    const columns = formatter.columnize([]);
    expect(columns).to.equal('');
  });
});
