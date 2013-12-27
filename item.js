var Knex = require('./knex');

var knex = Knex.initialize({client: 'sqlite3'});
// var knex = Knex.initialize({
//     client: 'sqlite3',
//     database: {
//       filename: 'memory'
//     }
// });

var creating = knex.schema
  .dropTableIfExists('items')
  .dropTable('newTable')
  .createTable('items', function(t) {
    t.bigIncrements();
    t.string('firstName').unique();
    t.text('firstName').defaultTo('Tim');
    t.dateTime('new_table').defaultTo(Knex.raw('CURRENT_TIMESTAMP'));
  });

var chain = knex
  .from('accounts')
  .column('item1 as item4')
  .column('item2')
  .sum('cols')
  .where('id', '=', 1)
  .where({i: 1, b: knex.raw(2)})
  .join('test_table_two', function() {
    this.on('accounts.id', '=', 'test_table_two.account_id')
        .orOn('item.id', '=', '');
  })
  .groupBy('items')
  .orderBy(['name', 'item', 'value'], 'asc')
  .orderBy('otherVal', 'desc')
  .transacting({})
  .forShare()
  .having('items', '<', 300)
  .orWhere('id', '=', knex.select('item as value').from('items').where('id', 2))
  .orWhere(function() {
    this.where('one', '=', 2);
  })
  .limit(2)
  .offset(1);

// console.log(chain)

console.log(
  chain.toSql(),
  creating.toSql()
);