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

  uuidToBin(uuid) {
    const buf = Buffer.from(uuid.replace(/-/g, ''), 'hex');
    return Buffer.concat([
      buf.slice(6, 8),
      buf.slice(4, 6),
      buf.slice(0, 4),
      buf.slice(8, 16),
    ]);
  }

  binToUuid(bin) {
    const buf = new Buffer(bin, 'hex');
    return [
      buf.toString('hex', 4, 8),
      buf.toString('hex', 2, 4),
      buf.toString('hex', 0, 2),
      buf.toString('hex', 8, 10),
      buf.toString('hex', 10, 16),
    ].join('-');
  }
}

module.exports = FunctionHelper;
