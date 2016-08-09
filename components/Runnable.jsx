import React, { PropTypes, Component } from 'react'
import dedent from 'dedent'
import {sql, js} from '../util/highlight'

export default class Runnable extends Component {

  output = null;

  static propTypes = {
    content: PropTypes.string.isRequired
  };

  static contextTypes = {
    runKnex: PropTypes.func.isRequired,
    knexSubscribe: PropTypes.func.isRequired
  };

  componentWillMount() {
    if (typeof window !== 'undefined') {
      this.runOutput()
    }
  }

  componentDidMount() {
    this.unsubscribe = this.context.knexSubscribe(this)
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  componentWillUpdate() {
    this.runOutput()
  }

  runOutput() {
    const output = this.context.runKnex(this.props.content)
    if (output.error) {
      this.highlightedSQL = output.error
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
        {output && 'Outputs:'}
        {output && <br />}
        {output && <code className="sql hljs" dangerouslySetInnerHTML={{__html: output}} />}
      </pre>
    )
  }

}
