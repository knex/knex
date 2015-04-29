var webpack = require('webpack');
var plugins = []

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

  externals: externals,

  plugins: plugins

};