
export default function schemaInterface(context) {
  return {
    table() {
      return context.schemaBuilder().alterTable(...arguments)
    },
    createTable() {
      return context.schemaBuilder().createTable(...arguments)
    },
    createTableIfNotExists() {
      return context.schemaBuilder().createTableIfNotExists(...arguments)
    },
    createSchema() {
      return context.schemaBuilder().createSchema(...arguments)
    },
    createSchemaIfNotExists() {
      return context.schemaBuilder().createSchemaIfNotExists(...arguments)
    },
    dropSchema() {
      return context.schemaBuilder().dropSchema(...arguments)
    },
    dropSchemaIfExists() {
      return context.schemaBuilder().dropSchemaIfExists(...arguments)
    },
    createExtension() {
      return context.schemaBuilder().createExtension(...arguments)
    },
    createExtensionIfNotExists() {
      return context.schemaBuilder().createExtensionIfNotExists(...arguments)
    },
    dropExtension() {
      return context.schemaBuilder().dropExtension(...arguments)
    },
    dropExtensionIfExists() {
      return context.schemaBuilder().dropExtensionIfExists(...arguments)
    },
    alterTable() {
      return context.schemaBuilder().alterTable(...arguments)
    },
    hasTable() {
      return context.schemaBuilder().hasTable(...arguments)
    },
    hasColumn() {
      return context.schemaBuilder().hasColumn(...arguments)
    },
    dropTable() {
      return context.schemaBuilder().dropTable(...arguments)
    },
    renameTable() {
      return context.schemaBuilder().renameTable(...arguments)
    },
    dropTableIfExists() {
      return context.schemaBuilder().dropTableIfExists(...arguments)
    },
    raw() {
      return context.schemaBuilder().raw(...arguments)
    }
  }
}
