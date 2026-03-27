const { inspect } = require('util');

// since we're loading code that's not ours when we read a knexfile, it can throw anything.
//
// this small helper class acts as glue between catching an error during knexfile handling
// and presenting the failure to the user when calling exit() with the result, determining
// how to format whatever we know about the failure to present a useful error to the user
//
// see https://github.com/knex/knex/issues/6082

class KnexfileRuntimeError {
  constructor(message, configPath, caught) {
    const strs = [message];

    if (caught instanceof Error) {
      strs.push(caught.stack ?? caught.message);
    } else {
      strs.push(
        `A non-Error value was thrown\n    at default export (${configPath})`
      );
      strs.push(inspect(caught));
    }
    this.message = strs.join('\n');
  }
}

module.exports = { KnexfileRuntimeError };
