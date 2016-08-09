import 'highlight.js/styles/github.css'
import '../assets/style.css'
import React from 'react'
import ReactDOM from 'react-dom'
import Documentation from './Documentation'

const changelog = require('../sections/changelog.md')

ReactDOM.render(
  <Documentation changelog={changelog} />,
  document.getElementById('documentation')
)
