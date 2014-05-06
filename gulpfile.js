var gulp = require('gulp');
var browserify = require('browserify');
var through = require('through');
var argv = require('minimist')(process.argv.slice(2));
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var excluded = {
  sqlite3: ['sqlite3'],
  mysql: ['mysql'],
  pg: ['pg', 'pg.js', 'pg-query-stream'],
  websql: ['sqlite3']
};

var bases = {
  mysql: './lib/dialects/mysql',
  pg: './lib/dialects/postgres',
  sqlite3: './lib/dialects/sqlite3',
  websql: './lib/dialects/websql'
};

var all = ['mysql', 'pg', 'sqlite3', 'websql'];

var externals = ['lodash', 'bluebird'];
var alwaysExcluded = ['generic-pool-redux', 'readable-stream', './lib/migrate/index.js'];

gulp.task('build', function() {
  var targets = argv.t || 'all';
  var outfile = argv.o || 'knex.js';
  if (targets === 'all') targets = all;
  if (!Array.isArray(targets)) targets = [targets];

  var b = browserify();

  for (var key in bases) {
    if (targets.indexOf(key) === -1) {
      b.exclude(bases[key]);
    }
  }

  b.transform(function() {
    var data = '';
    function write (buf) { data += buf; }
    function end () {
      this.queue(data.replace("require('bluebird/js/main/promise')()", "require('bluebird')"));
      this.queue(null);
    }
    return through(write, end);
  });

  targets.forEach(function(target) {
    excluded[target].forEach(function(file) {
      b.exclude(file);
    });
  });

  alwaysExcluded.forEach(function(file) {
    b.exclude(file);
  });

  externals.forEach(function(file) {
    b.external(file);
  });

  b.require('./knex.js', {expose: 'knex'});

  var b2 = browserify();
  b2.require('bluebird');
  b2.require('lodash');

  var igv = ['__filename','__dirname','process','global'];

  fs.mkdirAsync('./browser').catch(function(){}).finally(function() {
    var outStream = fs.createWriteStream('./browser/' + outfile);
    var depStream = fs.createWriteStream('./browser/deps.js');
    b.bundle({
      // insertGlobalVars: igv
    }).pipe(outStream);
    b2.bundle({
      // insertGlobalVars: igv
    }).pipe(depStream);
  });

});