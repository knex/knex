'use strict';

var gulp       = require('gulp');
var jshint     = require('gulp-jshint');

// Run the test... TODO: split these out to individual components.
gulp.task('jshint', function () {
  gulp.src([
      '*.js', 'lib/**/*.js', 'test/**/*.js',
      '!test/coverage/**/*.js', '!test/integration/migrate/**/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});