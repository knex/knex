module.exports = {
  'has a sum': {
    mysql: {
      bindings: [],
      sql: 'select sum(`logins`) as aggregate from `accounts`',
      result: [{
        aggregate: 10
      }]
    },
    postgresql: {
      bindings: [],
      sql: 'select sum("logins") as aggregate from "accounts"',
      result: [{
        aggregate: '10'
      }]
    },
    sqlite3: {
      bindings: [],
      sql: 'select sum("logins") as aggregate from "accounts"',
      result: [{
        aggregate: 10
      }]
    }
  },
  'has a count': {
    mysql: {
      bindings: [],
      sql: 'select count(`id`) as aggregate from `accounts`',
      result: [{
        aggregate: 6
      }]
    },
    postgresql: {
      bindings: [],
      sql: 'select count("id") as aggregate from "accounts"',
      result: [{
        aggregate: '6'
      }]
    },
    sqlite3: {
      bindings: [],
      sql: 'select count("id") as aggregate from "accounts"',
      result: [{
        aggregate: 6
      }]
    }
  },
  'support the groupBy function': {
    mysql: {
      bindings: [[],[]],
      sql: ['select count(`id`) as aggregate from `accounts` group by `logins`','select count(`id`) as aggregate from `accounts` group by `first_name`'],
      result: [[{
        aggregate: 2
      },{
        aggregate: 4
      }],[{
        aggregate: 6
      }]]
    },
    postgresql: {
      bindings: [[],[]],
      sql: ['select count("id") as aggregate from "accounts" group by "logins"','select count("id") as aggregate from "accounts" group by "first_name"'],
      result: [[{
        aggregate: '2'
      },{
        aggregate: '4'
      }],[{
        aggregate: '6'
      }]]
    },
    sqlite3: {
      bindings: [[],[]],
      sql: ['select count("id") as aggregate from "accounts" group by "logins"','select count("id") as aggregate from "accounts" group by "first_name"'],
      result: [[{
        aggregate: 2
      },{
        aggregate: 4
      }],[{
        aggregate: 6
      }]]
    }
  }
};