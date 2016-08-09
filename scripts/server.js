/* eslint no-console: 0 */
import 'colors'
import fs from 'fs'
import express from 'express'
import httpProxy from 'http-proxy'
import ip from 'ip'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

import Documentation from '../components/Documentation'

const development = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 4000

const app = express()

if (development) {
  const proxy = httpProxy.createProxyServer()
  const webpackPort = process.env.WEBPACK_DEV_PORT

  const target = `http://${ip.address()}:${webpackPort}`

  app.get('/assets/*', (req, res) => {
    proxy.web(req, res, { target })
  })
  app.get('/build/*', (req, res) => {
    proxy.web(req, res, { target })
  })

  proxy.on('error', e => {
    console.log('Could not connect to webpack proxy'.red)
    console.log(e.toString().red)
  })

  console.log('Prop data generation finished:'.green)

  app.get('/', function renderApp(req, res) {
    res.header('Access-Control-Allow-Origin', target)
    res.header('Access-Control-Allow-Headers', 'X-Requested-With')

    let html
    try {
      html = ReactDOMServer.renderToString(
        <Documentation />
      )
    } catch (e) {
      html = `<pre>${e.stack.replace(new RegExp(__dirname, 'g'), '~')}</pre>`
    }
    res.send(renderContent(html))
  })

  app.listen(port, () => {
    console.log(`Server started at:`)
    console.log(`- http://localhost:${port}`)
    console.log(`- http://${ip.address()}:${port}`)
  })

} else {
  fs.writeFileSync(
    path.join(__dirname, '../index.html'),
    renderContent(ReactDOMServer.renderToString(<Documentation />))
  )
}

function renderContent(content) {
  return `<!DOCTYPE HTML>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html;charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="chrome=1" />
    <meta name="viewport" content="width=device-width">
    <link rel="canonical" href="http://knexjs.org" />

    <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" href="/assets/favicons/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="/assets/favicons/favicon-16x16.png" sizes="16x16" />
    <link rel="manifest" href="/assets/favicons/manifest.json" />
    <link rel="mask-icon" href="/assets/favicons/safari-pinned-tab.svg" color="#e16426" />
    <meta name="theme-color" content="#ffffff" />

    <link rel="stylesheet" href="/build/bundle.css" />
    <title>Knex.js - A SQL Query Builder for Javascript</title>
  </head>
  <body>
    <div id="documentation">${content}</div>
  </body>
  <script type="text/javascript" src="/build/bundle.js"></script>
  <script type="text/javascript" src="/assets/ga.js"></script>
</html>
`
}
