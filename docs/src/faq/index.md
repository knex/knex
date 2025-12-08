# F.A.Q.

## How do I help contribute?

Glad you asked! Pull requests, or feature requests, though not always implemented, are a great way to help make Knex even better than it is now. If you're looking for something specific to help out with, there's a number of unit tests that aren't implemented yet, the library could never have too many of those. If you want to submit a fix or feature, take a look at the [Contributing](https://github.com/knex/knex/blob/master/CONTRIBUTING.md) readme in the Github and go ahead and open a ticket.

## How do I debug?

Knex is beginning to make use of the [debug](https://github.com/visionmedia/debug) module internally, so you can set the `DEBUG` environment variable to `knex:*` to see all debugging, or select individual namespaces `DEBUG=knex:query,knex:tx` to constrain a bit.

If you pass `{debug: true}` as one of the options in your initialize settings, you can see all of the query calls being made. Sometimes you need to dive a bit further into the various calls and see what all is going on behind the scenes. I'd recommend [node-inspector](https://github.com/dannycoates/node-inspector), which allows you to debug code with `debugger` statements like you would in the browser.

At the start of your application code will catch any errors not otherwise caught in the normal promise chain handlers, which is very helpful in debugging.

## How do I run the test suite?

The test suite looks for an environment variable called `KNEX_TEST` for the path to the database configuration. If you run the following command:

```bash
$ export KNEX_TEST='/path/to/your/knex_config.js'
$ npm test
```

replacing with the path to your config file, and the config file is valid, the test suite should run properly.

## My tests are failing because slow DB connection and short test timeouts! How to extend test timeouts?

Sometimes, e.g. when running CI on travis, test suite's default timeout of 5 seconds might be too short. In such cases an alternative test timeout value in milliseconds can be specified using the `KNEX_TEST_TIMEOUT` environment variable.

```bash
$ export KNEX_TEST_TIMEOUT=30000
$ npm test
```

## I found something broken with Amazon Redshift! Can you help?

Because there is no testing platform available for Amazon Redshift, be aware that it is included as a dialect but is unsupported. With that said, please file an issue if something is found to be broken that is not noted in the documentation, and we will do our best.
