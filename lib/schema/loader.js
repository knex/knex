"use strict";

var fs       = require('fs');
var path     = require('path');
var _        = require('lodash');
var Promise  = require('../promise');

var exec = Promise.promisify(require('child_process').exec);

// The new load we're performing, typically called from the `knex.schema`
// interface on the main `knex` object. Passes the `knex` instance performing
// the migration.
function Loader(knex) {
  this.knex   = knex;
  this.connectionSettings = knex.client.connectionSettings;
  this.config = this.setConfig(knex.client.schemaConfig);
}

function dump(settings, filename) {
  var commands = ['mysqldump', '-u' + settings.user, '--no-data', settings.database, '>', filename];
  var command = commands.join(' ');
  return exec(command);
}

function load(settings, filename) {
  var commands = ['mysql', '-u' + settings.user, settings.database, '<', filename];
  var command = commands.join(' ');
  return exec(command);
}

function drop(settings) {
  var commands = ['mysql', '-u' + settings.user, '-e', '"DROP DATABASE IF EXISTS ' + settings.database + ';"'];
  var command = commands.join(' ');
  return exec(command);
}

function create(settings) {
  var commands = ['mysql', '-u' + settings.user, '-e', '"CREATE DATABASE IF NOT EXISTS ' + settings.database + ';"'];
  var command = commands.join(' ');
  return exec(command);
}

// Dump the schema from the database into a file
Loader.prototype.dump = Promise.method(function(config) {
  this.config = this.setConfig(config);
  return dump(this.connectionSettings, this.config.filename);
});

// Load the schema into the database
Loader.prototype.load = Promise.method(function(config) {
  this.config = this.setConfig(config);
  return load(this.connectionSettings, this.config.filename);
});

// Drop the current schema
Loader.prototype.drop = Promise.method(function(config) {
  this.config = this.setConfig(config);
  return drop(this.connectionSettings);
});

// Create the current schema
Loader.prototype.create = Promise.method(function(config) {
  this.config = this.setConfig(config);
  return create(this.connectionSettings);
});

// Reset the current schema (drop, create, load)
Loader.prototype.reset = Promise.method(function(config) {
  var settings = this.connectionSettings;
  var config = this.config = this.setConfig(config);
  return drop(settings).then(function() {
    return create(settings);
  }).then(function() {
    return load(settings, config.filename);
  });
});


Loader.prototype.setConfig = function(config) {
  return _.extend({}, this.config || {}, config);
};

module.exports = Loader;
