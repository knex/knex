knex migrate:make create_users_table

knex:migrate          - runs migrations for the current env that have not run yet
knex:migrate:version  - runs one specific migration

knex:migrate:up       - runs one specific migration
knex:migrate:down     - rolls back one specific migration
knex:migrate:status   - shows current migration status
knex:migrate:rollback - rolls back the last migration


var db = knex.initialize({ ... });



var migrator = new db.migrate({
  path: './migrations',
  database: db,
  logger: console.log
});

migrator.currentVersion().then(...   /* "20130523" */

// Perform a migration
migrator.migrate().then(...
migrator.migrate({ to: "20130605" })

// Create a migration file
migrator.generate().then(...
migrator.generate("add_created_at_to_user")

{
  migrationCount: int,
  migrationsPerformed: []
}
