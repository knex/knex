'use strict';

var gulp       = require('gulp');
var bump       = require('gulp-bump');
var shell      = require('gulp-shell');
var argv       = require('minimist')(process.argv.slice(2));
var Promise    = require('bluebird');
var fs         = Promise.promisifyAll(require('fs'));
var jshint     = require('gulp-jshint');

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
