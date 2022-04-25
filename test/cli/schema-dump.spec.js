'use strict';

const path = require('path');
const { execCommand } = require('cli-testlab');
const { unlinkSync } = require('fs');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('schema:dump', () => {
  after(() => {
    unlinkSync('./test/cli/schema-dump.sql');
  })

  it('Dumps schema', () => {
    console.log(KNEX);
    return execCommand(`node ${KNEX} schema:dump`, {
      expectedOutput: { expectedText: 'Dumping schema', exactlyTimes: 1 },
    });
  });

  it('With output option', () => {
    return execCommand(`node ${KNEX} schema:dump --output=./test/cli/schema-dump.sql`, {
      expectedOutput: { expectedText: 'Dumping schema', exactlyTimes: 1 },
    });
  })
});
