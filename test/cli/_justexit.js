const { exit } = require('../../bin/utils/cli-config-utils');

switch (process.argv[2]) {
  case 'error':
    exit(new Error('exit(Error)'));
    break;
  case 'string':
    exit(new Error('exit(string)'));
    break;
  case 'stringable':
    exit({ message: 'normal object' });
    break;
  case 'non-stringable':
    exit(
      Object.assign(Object.create(null), { message: 'null-prototype object' })
    );
    break;
}
console.error('unknown argv[2]', process.argv[2]);
process.exit(2);
