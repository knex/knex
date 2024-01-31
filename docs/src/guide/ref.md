# Ref

Can be used to create references in a query, such as column- or tablenames. This is a good and shorter alternative to using `knex.raw('??', 'tableName.columName')` which essentially does the same thing.

## Usage

`knex.ref` can be used essentially anywhere in a build-chain. Here is an example:

```js
knex(knex.ref('Users').withSchema('TenantId'))
  .where(knex.ref('Id'), 1)
  .orWhere(knex.ref('Name'), 'Admin')
  .select(['Id', knex.ref('Name').as('Username')]);
```

<SqlOutput code="knex(knex.ref('Users').withSchema('TenantId'))
  .where(knex.ref('Id'), 1)
  .orWhere(knex.ref('Name'), 'Admin')
  .select(['Id', knex.ref('Name').as('Username')])"/>

### withSchema

The Ref function supports schema using `.withSchema(string)`:

```js
knex(knex.ref('users').withSchema('TenantId')).select();
```

### alias

Alias is supported using `.alias(string)`

```js
knex('users').select(knex.ref('Id').as('UserId'));
```

<SqlOutput code="knex('users')
  .select(knex.ref('Id').as('UserId'))"/>
