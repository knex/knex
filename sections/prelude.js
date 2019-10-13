
export default (version) => [
  {
    type: "text",
    content: [
      `<img height="108" id="logo" src="assets/images/knex.png" alt="Knex.js" />`,
      "**Knex.js** is a \"batteries included\" SQL query builder for **Postgres**, **MSSQL**, **MySQL**, **MariaDB**, **SQLite3**, **Oracle**, and **Amazon Redshift** designed to be flexible, portable, and fun to use. It features both traditional node style [callbacks](#Interfaces-Callbacks) as well as a [promise](#Interfaces-Promises) interface for cleaner async flow control, [a stream interface](#Interfaces-Streams), full featured [query](#Builder) and [schema](#Schema) builders, [**transaction support (with savepoints)**](#Transactions), connection [pooling](#Installation-pooling) and standardized responses between different query clients and dialects.",
      "The project is [hosted on GitHub](http://github.com/knex/knex), and has a comprehensive [test suite](https://travis-ci.org/knex/knex).",
      "Knex is available for use under the [MIT software license](http://github.com/knex/knex/blob/master/LICENSE).",
      "You can report bugs and discuss features on the [GitHub issues page](http://github.com/knex/knex/issues), add pages to the [wiki](https://github.com/knex/knex/wiki) or send tweets to [@tgriesser](http://twitter.com/tgriesser).",
      "Thanks to all of the great [contributions](https://github.com/knex/knex/graphs/contributors) to the project."
    ]
  },
  {
    type: "info",
    content: "Special thanks to [Taylor Otwell](https://twitter.com/taylorotwell) and his work on the [Laravel Query Builder](http://laravel.com/docs/queries), from which much of the builder's code and syntax was originally derived."
  },
  {
    type: "heading",
    size: "lg",
    content: `Latest Release: ${version} - <span class=\"small\">[Change Log](#changelog)</span>`
  },
  {
    type: "text",
    content: "Current Develop — [![Travis Badge](https://travis-ci.org/knex/knex.png?branch=master)](https://travis-ci.org/knex/knex)"
  }
]
