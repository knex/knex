'use strict';

var gulp       = require('gulp');
var bump       = require('gulp-bump');
var shell      = require('gulp-shell');
var browserify = require('browserify');
var argv       = require('minimist')(process.argv.slice(2));
var Promise    = require('bluebird');
var fs         = Promise.promisifyAll(require('fs'));
var jshint     = require('gulp-jshint');

var excluded = {
  oracle:   ['oracle'],
  mariasql: ['mariasql'],
  sqlite3:  ['sqlite3'],
  mysql:    ['mysql'],
  mysql2:   ['mysql2'],
  pg:       ['pg', 'pg.js', 'pg-query-stream'],
  websql:   ['sqlite3']
};

var bases = {
  oracle:   './lib/dialects/oracle',
  mariasql: './lib/dialects/maria',
  mysql:    './lib/dialects/mysql',
  mysql2:   './lib/dialects/mysql2',
  pg:       './lib/dialects/postgres',
  sqlite3:  './lib/dialects/sqlite3',
  websql:   './lib/dialects/websql'
};

var alwaysExcluded = ['./lib/migrate/index.js', './lib/seed/index.js'];

function ensureOutputDirectory() {
  return fs.mkdirAsync('./browser').catch(function(){});
}

function build(targets) {
  var b = browserify(['./knex.js'], {standalone: 'Knex'});
  for (var key in bases) {
    if (targets.indexOf(key) === -1) {
      b.exclude(bases[key]);
    }
  }
  targets.forEach(function(target) {
    excluded[target].forEach(function(file) {
      b.exclude(file);
    });
  });
  alwaysExcluded.forEach(function(file) {
    b.exclude(file);
  });
  return b;
}

function buildKnex() {
  var b = build(['mysql', 'mysql2', 'mariasql', 'pg', 'sqlite3', 'websql', 'oracle']);
  var outStream = fs.createWriteStream('./browser/knex.js');
  b.bundle().pipe(outStream);
  return outStream;
}

function buildWebSQL() {
  var b = build(['websql']);
  var outStream = fs.createWriteStream('./browser/websql.js');
  b.bundle().pipe(outStream);
  return outStream;
}

gulp.task('build', function() {

  // Need to temporarily rename, otherwise browserify seems to read the
  // local package.json, sees the browser path and doesn't build properly.
  return ensureOutputDirectory().then(function() {
    return fs.renameAsync('./package.json', './.package.json');
  }).then(function() {
    return new Promise(function(resolve, reject) {
      function finish() {
        fs.renameAsync('./.package.json', './package.json').then(resolve).catch(reject);
      }
      buildKnex().on('finish', function() {
        buildWebSQL().on('finish', finish);
      });
    });
  });

});

// Run the test... TODO: split these out to individual components.
gulp.task('jshint', function () {
  gulp.src([
      '*.js', 'lib/**/*.js', 'test/**/*.js',
      '!test/coverage/**/*.js', '!test/integration/migrate/migrations/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});
gulp.task('test', ['jshint'], shell.task(['npm run test']));

gulp.task('bump', function() {
  var type = argv.type || 'patch';
  return gulp.src('./package.json')
    .pipe(bump({type: type}))
    .pipe(gulp.dest('./'));
});
gulp.task('release', function() {
  return fs.readFileAsync('./package.json')
    .bind(JSON)
    .then(JSON.parse)
    .then(function(json) {
      return shell.task([
        'git add -u',
        'git commit -m "release ' + json.version + '"',
        'git tag ' + json.version,
        'npm publish',
        'git push',
        'git push --tags',
        'git checkout gh-pages',
        'git merge master',
        'git push',
        'git checkout master'
      ])();
    });
});
