var webpack = require('webpack');

var plugins = [
  new webpack.NormalModuleReplacementPlugin(/bluebird\/js\/main\/promise/, './util/bluebird'),
  new webpack.NormalModuleReplacementPlugin(/\.\.\/(migrate|seed)/, 'lodash/utility/noop'),
  new webpack.IgnorePlugin(/(migrate|seed|bin)/, /lib/),
  new webpack.IgnorePlugin(/(sqlite3|pg|pg-query-stream|mysql|mysql2|oracle)/, /node_modules/)
];

if (process.env.WEBSQL) {
  plugins.push(
    new webpack.IgnorePlugin(/(maria|mysql|mysql2|oracle|postgres|strong-oracle)\/.*/, /knex\/lib\/dialects/),
    new webpack.IgnorePlugin(/dialects\/(maria|mysql|mysql2|oracle|postgres|strong-oracle)\/.*/, /knex\/lib/)
  )
}

if (process.env.COMPRESS) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  );
}

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

if (process.env.WEBSQL) {
  externals.push(/^(?!\.).*/)
}

module.exports = {

  output: {
    library: 'Knex',
    libraryTarget: process.env.WEBSQL ?  'commonjs2' : 'umd',
    path: __dirname + "/browser",
    filename: process.env.WEBSQL ? "websql.js" : "knex.js"
  },

  entry: "./knex",

  externals: externals,

  plugins: plugins

};