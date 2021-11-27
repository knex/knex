import React, { Component } from 'react'
import PropTypes from 'prop-types'
import marked from '../util/marked'

export default class Heading extends Component {

  static propTypes = {
    href: PropTypes.string,
    content: PropTypes.string.isRequired,
    size: PropTypes.oneOf([ 'xs', 'sm', 'md', 'lg', 'xl' ])
  };

  render() {
    const props = {
      dangerouslySetInnerHTML: {__html: marked(this.props.content)}
    }
    if (this.props.href) {
      props.id = this.props.href
    }
    return React.createElement(sizeToTag[this.props.size], props)
  }
}

const sizeToTag = {
  xl: 'h1',
  lg: 'h2',
  md: 'h3',
  sm: 'h4',
  xs: 'h5'
}
