var gulp       = require('gulp');
var bump       = require('gulp-bump');
var shell      = require('gulp-shell');
var browserify = require('browserify');
var through    = require('through');
var argv       = require('minimist')(process.argv.slice(2));
var Promise    = require('bluebird');
var fs         = Promise.promisifyAll(require('fs'));

var excluded = {
  sqlite3: ['sqlite3'],
  mysql:   ['mysql'],
  pg:      ['pg', 'pg.js', 'pg-query-stream'],
  websql:  ['sqlite3']
};

var bases = {
  mysql:   './lib/dialects/mysql',
  pg:      './lib/dialects/postgres',
  sqlite3: './lib/dialects/sqlite3',
  websql:  './lib/dialects/websql'
};

var all = ['mysql', 'pg', 'sqlite3', 'websql'];

var externals      = ['lodash', 'bluebird'];
var alwaysExcluded = ['generic-pool-redux', 'readable-stream', './lib/migrate/index.js'];

function ensureOutputDirectory() {
  return fs.mkdirAsync('./browser').catch(function(){});
}

function buildKnex() {
  var targets = argv.t || 'all';
  var outfile = argv.o || 'knex.js';
  var standalone = argv.s || 'Knex';

  if (targets === 'all') targets = all;
  if (!Array.isArray(targets)) targets = [targets];

  var b = browserify(['./knex.js']);

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

  var outStream = fs.createWriteStream('./browser/' + outfile);
  ensureOutputDirectory().then(function() {
    b.bundle({standalone: standalone}).pipe(outStream);
  });
}

function buildDependencies() {
  var b = browserify();
  var depStream = fs.createWriteStream('./browser/deps.js');
  b.require('bluebird');
  b.require('lodash');
  ensureOutputDirectory().then(function() {
    b.bundle().pipe(depStream);
  });
}

gulp.task('build', buildKnex);
gulp.task('build:websql', function() {
  argv.t = 'websql';
  argv.o = argv.o || 'websql.js';
  buildKnex();
});
gulp.task('build:deps', buildDependencies);

gulp.task('bump-version', function() {
  var type = argv.type || 'patch';
  return gulp.src('./package.json')
    .pipe(bump({type: type}))
    .pipe(gulp.dest('./'));
});

gulp.task('jshint', shell.task([
  'jshint knex.js lib/*'
]));

// Run the test... TODO: split these out to individual components.
gulp.task('test', ['jshint'], shell.task([
  'mocha -b --check-leaks -R spec test/index.js'
]));

// Generate the docs.
gulp.task('docs', shell.task([
  'groc -o docs --verbose lib/*.js lib/**/*.js lib/**/**/*.js knex.js'
]));

gulp.task('release', ['test', 'bump-version'], function() {
  return fs.readFileAsync('./package.json')
    .bind(JSON)
    .then(JSON.parse)
    .then(function(json) {
      return shell.task([
        'git add -u',
        'git commit -m "release ' + json.version + '"',
        'git tag ' + json.version
      ])();
    });
});
