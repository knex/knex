// this file gets run by the cli tests to exercise the output of various
// calls to exit()

const { KnexfileRuntimeError } = require('../../bin/knexfile-runtime-error');
const { exit } = require('../../bin/utils/cli-config-utils');

switch (process.argv[2]) {
  case 'error':
    exit(new Error('called exit with an Error'));
    break;
  case 'knexfile-error-1':
    // this should be its own test, but here we want to know it did the right thing
    exit(
      new KnexfileRuntimeError(
        'called exit with a KnexfileRuntimeError',
        'config/path',
        new Error('source error')
      )
    );
    break;
  case 'knexfile-error-2':
    // this should be its own test, but here we want to know it did the right thing
    exit(
      new KnexfileRuntimeError(
        'called exit with a KnexfileRuntimeError',
        'config/path',
        { some: 'object' }
      )
    );
    break;
  case 'string':
    exit('called exit with a string');
    break;
  case 'stringable':
    exit({
      message: 'called exit with an object',
    });
    break;
  case 'non-stringable':
    exit(
      Object.assign(Object.create(null), {
        message: 'called exit with a null-prototype object',
      })
    );
    break;
}

// exit should .. exit. so if we get here something is weird
console.error('unknown argv[2]', process.argv[2]);
process.exit(3);
