module.exports = {  
  seed(knex) {
    return knex('xyz').del();
  }
}
