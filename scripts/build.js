/* eslint no-console: 0 */
import 'colors'
import execa from 'execa'
import {formatOutputStream} from './utils'

console.log('Building docs for production'.cyan)

const env = {
  ...process.env,
  NODE_ENV: 'production'
}

formatOutputStream('docs-server', execa('babel-node', [
  'scripts/server.js'
], {env}))

formatOutputStream('webpack', execa('webpack', [
  '--config', 'scripts/webpack.config.js',
  '--color'
], {env}))
