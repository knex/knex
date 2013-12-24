module.exports = function(grunt) {

  grunt.initConfig({
    uglify: {
      dist: {
        files: {
          'build/knex-min.js': ['build/knex.js']
        }
      }
    },
    browserify: {
      dist: {
        files: {
          'build/knex.js': ['lib/browser.js'],
        },
        options: {
          alias: ['./lib/migrate-stub.js:./lib/migrate'],
          external: ['bluebird/js/main/promise', 'lodash'],
          ignoreGlobals: true,
          detectGlobals: false,
          standalone: 'knex',
          postBundleCB: function(err, src, next) {
            next(err, src
              .replace('define(e):"undefined"', 'define(["bluebird", "lodash"], e):"undefined"')
              .replace('bluebird/js/main/promise\')()', 'bluebird\')')
              .replace('bluebird/js/main/promise', 'bluebird')
            );
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-release');
  grunt.registerTask('build', ['browserify', 'uglify']);
};