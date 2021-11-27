import React, { Component } from 'react'

import Knex from 'knex'

import Sidebar from './Sidebar'
import LanguageSelect from './LanguageSelect'
import Fork from './Fork'
import PropTypes from "prop-types";

export default class Container extends Component {

  static propTypes = {
    children: PropTypes.node.isRequired
  };

  static childContextTypes = {
    knexSubscribe: PropTypes.func.isRequired,
    runKnex: PropTypes.func.isRequired
  };

  constructor() {
    super()
    this.state = {
      language: 'mysql'
    }
  }

  registry = new Set();

  changeLanguage = (language) => {
    try {
      localStorage.knexLanguage = language
    } catch (e) {} // eslint-disable-line
    this.setState({ language }, this.initKnex)
  };

  initKnex() {
    const config = {client: this.state.language};
    if (this.state.language === 'mysql') {
      config.version = '5.7'
    }
    this.knex = Knex(config)
    this.knex.client.transacting = true
    this.trx = this.knex
    this.registry.forEach(component => component.forceUpdate())
    if (typeof window !== 'undefined') {
      window.knex = this.knex
    }
  }

  componentDidMount() {
    this.initKnex()
    if (typeof window !== 'undefined') {
      window.Knex = Knex
    }
    const next = localStorage.knexLanguage
    if (next && next !== 'mysql') {
      this.changeLanguage(next)
    }
  }

  knexSubscribe = component => {
    this.registry.add(component)
    return () => this.registry.remove(component)
  };

  runKnex = code => {
    let output
    try {
      const blocks = code.split('\n\n')
      blocks[blocks.length - 1] = `return (${blocks[blocks.length - 1]}).toString()`
      output = new Function('knex', 'trx', blocks.join('\n\n'))(this.knex, this.trx)
    } catch (e) {
      output = {error: e.message}
    }
    return output
  };

  getChildContext() {
    return {
      knexSubscribe: this.knexSubscribe,
      runKnex: this.runKnex
    }
  }

  render() {
    const {state: { language }, props: { children, version }} = this
    return (
      <div>
        {/* Sidebar */}
        <Sidebar sections={children} version={version} />

        {/* Select Language */}
        <LanguageSelect
          language={language}
          changeLanguage={this.changeLanguage} />

        {/* Fork Me */}
        <Fork {...this.props} />

        {/* Container elements */}
        <div className="container">
          {children}
        </div>

      </div>
    )
  }
}
