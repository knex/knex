'use strict';

const path = require('path');
const { execCommand } = require('cli-testlab');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('schema:dump', () => {
  it('Dump schema', () => {
    return execCommand(`node ${KNEX} schema:dump`, {
      expectedOutput: { expectedText: 'Dumping schema', exactlyTimes: 1 },
    });
  });
});
