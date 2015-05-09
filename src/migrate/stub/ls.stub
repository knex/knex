'use strict';

exports.up = (knex, Promise) ->
  <% if (d.tableName) { %>
  knex.schema.create-table "<%= d.tableName %>", (t) ->
    t.increments!
    t.timestamp!
  <% } %>


exports.down = (knex, Promise) ->
  <% if (d.tableName) { %>
  knex.schema.drop-table "<%= d.tableName %>"
  <% } %>

