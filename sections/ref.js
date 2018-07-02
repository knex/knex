export default [
  {
    type: "heading",
    size: "lg",
    content: "Ref",
    href: "Ref"
  },
  {
    type: "text",
    content: "Can be used to create references in a query, such as column- or tablenames. This is a good and shorter alternative to using `knex.raw('??', 'tableName.columName') which essentially does the same thing.`"
  },
  {
    type: "heading",
    size: "md",
    content: "Usage:",
    href: "Ref-Usage"
  },
  {
    type: "text",
    content: "`knex.ref` can be used essentially anywhere in a build-chain. Here is an example:"
  },
  {
    type: "runnable",
    content: `
      knex(knex.ref('Users').withSchema('TenantId'))
        .where(knex.ref('Id'), 1)
        .orWhere(knex.ref('Name'), 'Admin')
        .select(['Id', knex.ref('Name').as('Username')])
    `
  },
  {
    type: "heading",
    size: "md",
    content: "withSchema:",
    href: "Ref-withSchema"
  },
  {
    type: "text",
    content: "The Ref function supports schema using `.withSchema(string)`:"
  },
  {
    type: "runnable",
    content: `
      knex(knex.ref('users').withSchema('TenantId')).select()
    `
  },
  {
    type: "heading",
    size: "md",
    content: "alias:",
    href: "Ref-alias"
  },
  {
    type: "text",
    content: "Alias is supported using `.alias(string)`"
  },
  {
    type: "runnable",
    content: `
      knex('users')
        .select(knex.ref('Id').as('UserId'))
    `
  },
]
