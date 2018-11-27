import ExtractTextPlugin from 'extract-text-webpack-plugin'
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
  new webpack.IgnorePlugin(/package\.json/, /mssql/),
  new webpack.NoErrorsPlugin(),
  new ExtractTextPlugin('[name].css'),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(options.optimizeMinimize ? 'production' : 'development')
    }
  })
]

export default {

  resolve: {
    extensions: ['.js', '.jsx'],
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
  
  node: {
    fs: 'empty'
  },

  module: {
    loaders: [
      {
        test: /\.md$/i,
        loader: 'raw-loader'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          cacheDirectory: true
        }
      },
      {
        test: /\.css/,
        loader: ExtractTextPlugin.extract({ 
          fallback: 'style-loader', 
          use: `css-loader${cssSourceMap}` 
        })
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.jpe?g$|\.gif$|\.png|\.ico$/,
        loader: 'file?name=[name].[ext]'
      },
      {
        test: /\.eot$|\.ttf$|\.svg$|\.woff2?$/,
        loader: 'file?name=[name].[ext]'
      },
      {
        test: /ansi-styles|chalk|tarn/,
        loader: 'babel-loader'
      }
    ],
  },

  plugins
}
