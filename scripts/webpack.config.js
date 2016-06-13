var webpack = require('webpack');
var plugins = [
  function() {
    this.plugin("done", function(stats) {
      if (stats.compilation.errors && stats.compilation.errors.length && process.argv.indexOf('--watch') === -1) {
        process.on('beforeExit', function() {
          process.exit(1);
        });
      }
    });
  }
]

var externals = [{
  "bluebird": {
    root: "Promise",
    commonjs2: "bluebird",
    commonjs: "bluebird",
    amd: "bluebird"
  },
  "lodash": {
    root: "_",
    commonjs2: "lodash",
    commonjs: "lodash",
    amd: "lodash"
  }
}]

module.exports = {

  output: {
    library: 'Knex',
    libraryTarget: 'umd'
  },

  module: {
    loaders: [{
      test: /\.json$/, loader: 'json-loader'
    }]
  },

  externals: externals,

  plugins: plugins

};
