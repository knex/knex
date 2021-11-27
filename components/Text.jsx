import React, { Component } from 'react'
import marked from '../util/marked'
import PropTypes, {oneOfType} from "prop-types";

export default class Text extends Component {

  static propTypes = {
    content: oneOfType([
      PropTypes.string,
      PropTypes.array
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
