const webpack = require("webpack");

module.exports = {
    entry: './webpack-entry.js',
    output: {
        filename: "build/knex.min.js",
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    plugins: [
       new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ],
}