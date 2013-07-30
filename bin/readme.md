
knex migrate:make create_users_table

knex migrate:make foo --config=app/migrations

knex migrate:make create_users_table --table=users --create

knex migrate --module=vendor/package


var db = Knex.Initialize({ ... });

var migrator = new Knex.Migrator({
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
