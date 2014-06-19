'use strict';

exports.up = function(knex, Promise) {
  <% if (d.tableName) { %>
  return knex.schema.createTable("<%= d.tableName %>", function(t) {
    t.increments();
    t.timestamp();
  });
  <% } %>
};

exports.down = function(knex, Promise) {
  <% if (d.tableName) { %>
  return knex.schema.dropTable("<%= d.tableName %>");
  <% } %>
};
