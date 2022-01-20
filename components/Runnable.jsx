import React, { Component } from 'react'
import dedent from 'dedent'
import {sql, js} from '../util/highlight'
import PropTypes from "prop-types";

export default class Runnable extends Component {

  output = null;

  static propTypes = {
    content: PropTypes.string.isRequired
  };

  static contextTypes = {
    runKnex: PropTypes.func.isRequired,
    knexSubscribe: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  componentWillUpdate() {
    this.runOutput()
  }

  componentWillMount() {
    this.runOutput()
    this.unsubscribe = this.context.knexSubscribe(this)
  }

  runOutput() {
    const output = this.context.runKnex(this.props.content)
    this.didError = false
    if (output.error) {
      this.highlightedSQL = output.error
      this.didError = true
    } else {
      this.highlightedSQL = sql(output)
    }
  }

  render() {
    const {props: {content}} = this
    const output = this.highlightedSQL || null

    return (
      <pre className="display">
        <code className="js hljs" dangerouslySetInnerHTML={{__html: js(dedent(content))}} />
        {output && <br />}
        {this.didError ? 'Error:' : 'Outputs:'}
        {output && <br />}
        {output && <code className="sql hljs" dangerouslySetInnerHTML={{__html: output}} />}
      </pre>
    )
  }

}
