// FunctionHelper
// -------
// Used for adding functions from the builder
// Example usage: table.dateTime('datetime_to_date').notNull().defaultTo(knex.fn.now());
class FunctionHelper {
  constructor(client) {
    this.client = client;
  }

  now(precision) {
    if (typeof precision === 'number') {
      return this.client.raw(`CURRENT_TIMESTAMP(${precision})`);
    }
    return this.client.raw('CURRENT_TIMESTAMP');
  }
}

module.exports = FunctionHelper;
