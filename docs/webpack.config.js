var webpack = require('webpack');

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
    libraryTarget: 'umd',
    path: __dirname + "/assets/",
    filename: "knex.js"
  },

  entry: "./assets/index.js",

  externals: externals

};