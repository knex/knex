const MiniCssExtractPlugin = require("mini-css-extract-plugin");
import ip from 'ip'
import webpack from 'webpack'
import yargs from 'yargs'
import path from 'path'

export const options = yargs
  .alias('p', 'optimize-minimize')
  .alias('d', 'debug')
  .option('port', {
    default: '8080',
    type: 'string'
  })
  .argv

const webpackDevServerAddress = `http://${ip.address()}:${options.port}`
const cssSourceMap = options.debug ? '?sourceMap' : ''

const entryFile = path.join(__dirname, '../components/client.jsx')

const devEntryBundle = [
  'webpack/hot/dev-server',
  `webpack-dev-server/client?${webpackDevServerAddress}`,
  entryFile,
]
const plugins = [
  new webpack.IgnorePlugin({resourceRegExp : /package\.json/, contextRegExp : /mssql/}),
  new webpack.NoEmitOnErrorsPlugin(),
  new MiniCssExtractPlugin({filename: '[name].css'}),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(options.optimizeMinimize ? 'production' : 'development')
    }
  })
]

export default {

  resolve: {
    extensions: ['.js', '.jsx'],
    preferRelative: true,
    fallback: {
      "timers": false,
      "util": false,
      "tty": false,
      "crypto": false,
      "path-browserify": false,
      "stream-browserify": false,
      "os-browserify": false,
      "assert": false,
      "stream": false,
      "os": false,
      "path": false,
      "fs": false
    }
  },

  devtool: 'source-map',

  entry: {
    bundle: options.debug ? devEntryBundle : entryFile,
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, '../build'),
    publicPath: options.debug ? `${webpackDevServerAddress}/build/` : '/build/',
  },

  module: {
    rules: [
      {
        test: /\.md$/i,
        loader: 'raw-loader'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          cacheDirectory: true
        }
      },
      {
        test: /\.css/,
        use: [MiniCssExtractPlugin.loader, `css-loader${cssSourceMap}`],
      },
      {
        test: /\.jpe?g$|\.gif$|\.png|\.ico$/,
        loader: 'file',
        options: {
          name : '[name].[ext]'
        }
      },
      {
        test: /\.eot$|\.ttf$|\.svg$|\.woff2?$/,
        loader: 'file',
        options: {
          name : '[name].[ext]'
        }
      },
      {
        test: /ansi-styles|chalk|tarn/,
        loader: 'babel-loader'
      }
    ],
  },

  plugins
}
