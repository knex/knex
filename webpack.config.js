var webpack = require('webpack');

var plugins = [
  new webpack.NormalModuleReplacementPlugin(/\.\.\/(migrate|seed)/, 'lodash/utility/noop'),
  new webpack.IgnorePlugin(/(migrate|seed|bin)/, /lib/),
  new webpack.IgnorePlugin(/(sqlite3|pg|pg-query-stream|mysql|mysql2|oracle)/, /node_modules/)
];

if (process.env.COMPRESS) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  );
}

module.exports = {

  output: {
    library: 'Knex',
    libraryTarget: 'umd'
  },

  externals: [{
    "bluebird": {
      root: "Bluebird",
      commonjs2: "bluebird",
      commonjs: "bluebird",
      amd: "bluebird"
    },
    "lodash": {
      root: "_",
      commonjs2: "lodash",
      commonjs: "lodash",
      amd: "lodash"
    },
    "crypto": "crypto"
  }],

  plugins: plugins

};