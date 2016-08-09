import React, { Component } from 'react'
import marked from '../util/marked'

export default class Text extends Component {

  static propTypes = {
    content: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.array
    ])
  };

  render() {
    const {props: { content, type }} = this
    if (typeof content === 'string') {
      const props = { dangerouslySetInnerHTML: {__html: marked(content)} }
      if (type === 'info') {
        props.className = "info"
      }
      return (
        <p {...props} />
      )
    }
    return (
      <div>
        {content.map((val, i) => (
          <p key={i} dangerouslySetInnerHTML={{__html: marked(val)}} />
        ))}
      </div>
    )
  }

}
