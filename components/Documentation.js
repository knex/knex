import React, { Component, PropTypes } from 'react'

import Section from './Section'
import Container from './Container'
import Changelog from './Changelog'

import builder from '../sections/builder'
import faq from '../sections/faq'
import installation from '../sections/installation'
import interfaces from '../sections/interfaces'
import migrations from '../sections/migrations'
import prelude from '../sections/prelude'
import raw from '../sections/raw'
import ref from '../sections/ref'
import schema from '../sections/schema'
import seeds from '../sections/seeds'
import support from '../sections/support'
import transactions from '../sections/transactions'
import upgrading from '../sections/upgrading'
import utility from '../sections/utility'
import typescriptSupport from '../sections/typescript-support'
import parseChangeLog from '../util/parseChangeLog'

const constants = {
  projectUrl: 'https://github.com/knex/knex',
}

// The "container" for the documentation,
// we require all of the doc sections and render them
export default class Documentation extends Component {

  static propTypes = {
    changelog: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired
  };

  render() {
    const {props: {version, changelog}} = this
    return (
      <Container {...constants} version={this.props.version}>
        <Section id="Prelude" content={prelude(this.props.version)} />
        <Section id="Upgrading" content={upgrading} />
        <Section id="Installation" content={installation} />
        <Section id="TypeScript Support" content={typescriptSupport} />
        <Section id="Builder" content={builder} />
        <Section id="Transactions" content={transactions} />
        <Section id="Schema" content={schema} />
        <Section id="Raw" content={raw} />
        <Section id="Ref" content={ref} />
        <Section id="Utility" content={utility} />
        <Section id="Interfaces" content={interfaces} />
        <Section id="Migrations" content={migrations} />
        <Section id="Seeds" content={seeds} />
        <Section id="Support" content={support} />
        <Section id="Faq" content={faq} />
        <Changelog id="Changelog" version={version} content={parseChangeLog(changelog)} />
      </Container>
    )
  }
}
