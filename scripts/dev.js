/* eslint-disable no-console, no-process-exit */

import 'colors'
import portfinder from 'portfinder'
import execa from 'execa'
import ip from 'ip'
import {formatOutputStream} from './utils'

portfinder.basePort = 4000

console.log('Starting docs in Development mode'.cyan)

portfinder.getPorts(2, {}, (portFinderErr, [docsPort, webpackPort]) => {
  if (portFinderErr) {
    console.log('Failed to acquire ports'.red)
    process.exit(1)
  }

  formatOutputStream('webpack-dev-server', execa('nodemon', [
      '--watch', 'webpack',
      '--watch', 'scripts/webpack.config.js',
      '--exec', 'webpack-dev-server',
      '--',
      '--config', 'scripts/webpack.config.js',
      '--color',
      '--port', webpackPort,
      '--debug',
      '--hot',
      '--host', ip.address()
  ]))

  formatOutputStream('docs-server', execa('nodemon', [
      '--watch', 'components',
      '--watch', 'sections',
      '--watch', require.resolve('knex/CHANGELOG.md'),
      '-e', 'js,jsx',
      '--exec', 'babel-node scripts/server.js'
  ], {
      env: {
        PORT: docsPort,
        WEBPACK_DEV_PORT: webpackPort,
        ...process.env
      }
  }))
})
