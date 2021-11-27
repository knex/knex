export default [
  {
    type: "heading",
    size: "lg",
    content: "Raw",
    href: "Raw"
  },
  {
    type: "text",
    content: "Sometimes you may need to use a raw expression in a query. Raw query object may be injected pretty much anywhere you want, and using proper bindings can ensure your values are escaped properly, preventing SQL-injection attacks."
  },
  {
    type: "heading",
    size: "md",
    content: "Raw Parameter Binding:",
    href: "Raw-Bindings"
  },
  {
    type: "text",
    content: "One can paramterize sql given to `knex.raw(sql, bindings)`. Parameters can be positional named. One can also choose if parameter should be treated as value or as sql identifier e.g. in case of `'TableName.ColumnName'` reference."
  },
  {
    type: "runnable",
    content: `
      knex('users')
        .select(knex.raw('count(*) as user_count, status'))
        .where(knex.raw(1))
        .orWhere(knex.raw('status <> ?', [1]))
        .groupBy('status')
    `
  },
  {
    type: "text",
    content: "Positional bindings `?` are interpreted as values and `??` are interpreted as identifiers."
  },
  {
    type: "runnable",
    content: `
      knex('users').where(knex.raw('?? = ?', ['user.name', 1]))
    `
  },
  {
    type: "text",
    content: "Named bindings such as `:name` are interpreted as values and `:name:` interpreted as identifiers. Named bindings are processed so long as the value is anything other than `undefined`."
  },
  {
    type: "runnable",
    content: `
      knex('users')
        .where(knex.raw(':name: = :thisGuy or :name: = :otherGuy or :name: = :undefinedBinding', {
          name: 'users.name',
          thisGuy: 'Bob',
          otherGuy: 'Jay',
          undefinedBinding: undefined
        }))
    `
  },
  {
    type: "text",
    content: "For simpler queries where one only has a single binding, `.raw` can accept said binding as its second parameter."
  },
  {
    type: "runnable",
    content: `
      knex('users')
        .where(
          knex.raw('LOWER(\"login\") = ?', 'knex')
        )
        .orWhere(
          knex.raw('accesslevel = ?', 1)
        )
        .orWhere(
          knex.raw('updtime = ?', '01-01-2016')
        )
    `
  },
  {
    type: "text",
    content: "Since there is no unified syntax for array bindings, instead you need to treat them as multiple values by adding `?` directly in your query."
  },
  {
    type: "runnable",
    content: `
      const myArray = [1,2,3]
      knex.raw('select * from users where id in (' + myArray.map(_ => '?').join(',') + ')', [...myArray]);
      // query will become: select * from users where id in (?, ?, ?) with bindings [1,2,3]
    `
  },
  {
    type: "text",
    content: "To prevent replacement of `?` one can use the escape sequence `\\\\?`."
  },
  {
    type: "runnable",
    content: `
      knex.select('*').from('users').where('id', '=', 1).whereRaw('?? \\\\? ?', ['jsonColumn', 'jsonKey'])
    `
  },
  {
    type: "text",
    content: "To prevent replacement of named bindings one can use the escape sequence `\\\\:`."
  },
  {
    type: "runnable",
    content: `
      knex.select('*').from('users').whereRaw(\":property: = '\\\\:value' OR \\\\:property: = :value\", {
        property: 'name',
        value: 'Bob'
      })
    `
  },
  {
    type: "heading",
    size: "md",
    content: "Raw Expressions:",
    href: "Raw-Expressions"
  },
  {
    type: "text",
    content: "Raw expressions are created by using `knex.raw(sql, [bindings])` and passing this as a value for any value in the query chain."
  },
  {
    type: "runnable",
    content: `
      knex('users')
        .select(knex.raw('count(*) as user_count, status'))
        .where(knex.raw(1))
        .orWhere(knex.raw('status <> ?', [1]))
        .groupBy('status')
    `
  },
  {
    type: "heading",
    size: "md",
    content: "Raw Queries:",
    href: "Raw-Queries"
  },
  {
    type: "text",
    content: "The `knex.raw` may also be used to build a full query and execute it, as a standard query builder query would be executed. The benefit of this is that it uses the connection pool and provides a standard interface for the different client libraries."
  },
  {
    type: "code",
    language: "js",
    content: "knex.raw('select * from users where id = ?', [1]).then(function(resp) { ... });"
  },
  {
    type: "info",
    content: "Note that the response will be whatever the underlying sql library would typically return on a normal query, so you may need to look at the documentation for the base library the queries are executing against to determine how to handle the response."
  },
  {
    type: "heading",
    size: "md",
    content: "Wrapped Queries:",
    href: "Raw-queries-wrapped"
  },
  {
    type: "text",
    content: "The raw query builder also comes with a `wrap` method, which allows wrapping the query in a value:"
  },
  {
    type: "runnable",
    content: "const subcolumn = knex.raw('select avg(salary) from employee where dept_no = e.dept_no')\n  .wrap('(', ') avg_sal_dept');\n\nknex.select('e.lastname', 'e.salary', subcolumn)\n  .from('employee as e')\n  .whereRaw('dept_no = e.dept_no')\n"
  },
  {
    type: "text",
    content: "Note that the example above be achieved more easily using the [as](#Builder-as) method."
  },
  {
    type: "runnable",
    content: "const subcolumn = knex.avg('salary')\n  .from('employee')\n  .whereRaw('dept_no = e.dept_no')\n  .as('avg_sal_dept');\n\nknex.select('e.lastname', 'e.salary', subcolumn)\n  .from('employee as e')\n  .whereRaw('dept_no = e.dept_no')\n"
  }
]
