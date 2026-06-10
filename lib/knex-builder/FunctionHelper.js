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

  uuid() {
    switch (this.client.driverName) {
      case 'sqlite3':
      case 'better-sqlite3':
        return this.client.raw(
          "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"
        );
      case 'mssql':
        return this.client.raw('(NEWID())');
      case 'pg':
      case 'pgnative':
      case 'cockroachdb':
        return this.client.raw('(gen_random_uuid())');
      case 'oracle':
      case 'oracledb':
        return this.client.raw('(random_uuid())');
      case 'mysql':
      case 'mysql2':
        return this.client.raw('(UUID())');
      default:
        throw new Error(
          `${this.client.driverName} does not have a uuid function`
        );
    }
  }

  uuidToBin(uuid, ordered = true) {
    const buf = Buffer.from(uuid.replace(/-/g, ''), 'hex');
    return ordered
      ? Buffer.concat([
          buf.slice(6, 8),
          buf.slice(4, 6),
          buf.slice(0, 4),
          buf.slice(8, 16),
        ])
      : Buffer.concat([
          buf.slice(0, 4),
          buf.slice(4, 6),
          buf.slice(6, 8),
          buf.slice(8, 16),
        ]);
  }

  binToUuid(bin, ordered = true) {
    const buf = Buffer.from(bin, 'hex');
    return ordered
      ? [
          buf.toString('hex', 4, 8),
          buf.toString('hex', 2, 4),
          buf.toString('hex', 0, 2),
          buf.toString('hex', 8, 10),
          buf.toString('hex', 10, 16),
        ].join('-')
      : [
          buf.toString('hex', 0, 4),
          buf.toString('hex', 4, 6),
          buf.toString('hex', 6, 8),
          buf.toString('hex', 8, 10),
          buf.toString('hex', 10, 16),
        ].join('-');
  }
}

module.exports = FunctionHelper;
