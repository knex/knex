# Raw

Sometimes you may need to use a raw expression in a query. Raw query object may be injected pretty much anywhere you want, and using proper bindings can ensure your values are escaped properly, preventing SQL-injection attacks.

## Raw Parameter Binding

One can parameterize sql given to `knex.raw(sql, bindings)`. Parameters can be positional named. One can also choose if parameter should be treated as value or as sql identifier e.g. in case of `'TableName.ColumnName'` reference.

```js
// @sql
knex('users')
  .select(knex.raw('count(*) as user_count, status'))
  .where(knex.raw(1))
  .orWhere(knex.raw('status <> ?', [1]))
  .groupBy('status');
```

Positional bindings `?` are interpreted as values and `??` are interpreted as identifiers.

```js
// @sql
knex('users').where(knex.raw('?? = ?', ['user.name', 1]));
```

Named bindings such as `:name` are interpreted as values and `:name:` interpreted as identifiers. Named bindings are processed so long as the value is anything other than `undefined`. If a placeholder is left unresolved, knex will throw.

```js
const raw = ':name: = :thisGuy or :name: = :otherGuy';

// @sql
knex('users').where(
  knex.raw(raw, {
    name: 'users.name',
    thisGuy: 'Bob',
    otherGuy: 'Jay',
  })
);
```

Error case (unresolved placeholder):

```js
const raw = ':name: = :thisGuy or :name: = :otherGuy or :name: = :missing';

knex('users').where(
  knex.raw(raw, {
    name: 'users.name',
    thisGuy: 'Bob',
    otherGuy: 'Jay',
    missing: undefined,
  })
);
```

For simpler queries where one only has a single binding, `.raw` can accept said binding as its second parameter.

```js
// @sql
knex('users')
  .where(knex.raw('LOWER("login") = ?', 'knex'))
  .orWhere(knex.raw('accesslevel = ?', 1))
  .orWhere(knex.raw('updtime = ?', '01-01-2016'));
```

Since there is no unified syntax for array bindings, instead you need to treat them as multiple values by adding `?` directly in your query.

```js
const myArray = [1, 2, 3];
// @sql
knex.raw(
  'select * from users where id in (' + myArray.map((_) => '?').join(',') + ')',
  [...myArray]
);
```

### Named bindings with array values

If you need named bindings and one of the bindings is an array used in an `IN` list,
you can pass a `knex.raw(...)` as the named binding. This lets knex expand the array
as placeholders instead of building SQL by string concatenation.

```js
const names = ['Sally', 'Jay', 'Foobar'];
const bindings = {
  names: knex.raw(names.map(() => '?').join(', '), names),
  age: 21,
  limit: 100,
};

// @sql
knex.raw(
  `
  select * from people
  where "name" in (:names)
  and "age" > :age
  limit :limit
  `,
  bindings
);
```

> **Security note:** Avoid interpolating raw strings for lists when values come
> from users. Using `knex.raw(..., names)` as shown above keeps values bound as
> parameters.

To prevent replacement of `?` one can use the escape sequence `\\?`.

```js
// @sql
knex
  .select('*')
  .from('users')
  .where('id', '=', 1)
  .whereRaw('?? \\? ?', ['jsonColumn', 'jsonKey']);
```

To prevent replacement of named bindings one can use the escape sequence `\\:`.

```js
// @sql
knex
  .select('*')
  .from('users')
  .whereRaw(":property: = '\\:value' OR \\:property: = :value", {
    property: 'name',
    value: 'Bob',
  });
```

#### PostgreSQL: `ANY()` alternative

PostgreSQL supports `ANY()` for array bindings, which keeps the binding as an
array rather than expanding into many placeholders.

```js
const names = ['Sally', 'Jay', 'Foobar'];
const bindings = {
  names,
  age: 21,
  limit: 100,
};

// @sql
(() => {
  // Only valid for PostgreSQL.
  if (!['postgres', 'pgnative'].includes(knex.client.config.client)) {
    return;
  }

  return knex.raw(
    `
    select * from people
    where "name" = any(:names)
    and "age" > :age
    limit :limit
    `,
    bindings
  );
})();
```

> **Note:** `ANY()` is PostgreSQL-specific.

## Raw Expressions

Raw expressions are created by using `knex.raw(sql, [bindings])` and passing this as a value for any value in the query chain.

```js
// @sql
knex('users')
  .select(knex.raw('count(*) as user_count, status'))
  .where(knex.raw(1))
  .orWhere(knex.raw('status <> ?', [1]))
  .groupBy('status');
```

## Raw Queries

The `knex.raw` may also be used to build a full query and execute it, as a standard query builder query would be executed. The benefit of this is that it uses the connection pool and provides a standard interface for the different client libraries.

```js
knex.raw('select * from users where id = ?', [1]).then(function (resp) {
  /*...*/
});
```

Note that the response will be whatever the underlying sql library would typically return on a normal query, so you may need to look at the documentation for the base library the queries are executing against to determine how to handle the response.

## Wrapped Queries

The raw query builder also comes with a `wrap` method, which allows wrapping the query in a value:

```js
// @sql
const subcolumn = knex
  .raw('select avg(salary) from employee where dept_no = e.dept_no')
  .wrap('(', ') avg_sal_dept');

knex
  .select('e.lastname', 'e.salary', subcolumn)
  .from('employee as e')
  .whereRaw('dept_no = e.dept_no');
```

Note that the example above be achieved more easily using the [as](/guide/query-builder#as) method.

```js
// @sql
const subcolumn = knex
  .avg('salary')
  .from('employee')
  .whereRaw('dept_no = e.dept_no')
  .as('avg_sal_dept');

knex
  .select('e.lastname', 'e.salary', subcolumn)
  .from('employee as e')
  .whereRaw('dept_no = e.dept_no');
```
