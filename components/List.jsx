import React, { Component } from 'react'
import marked from '../util/marked'
import PropTypes from "prop-types";

export default class List extends Component {

  static propTypes = {
    content: PropTypes.arrayOf(PropTypes.string).isRequired
  };

  render() {
    return (
      <ul>
        {this.props.content.map((item, i) => {
          return <li key={i} dangerouslySetInnerHTML={{__html: marked(item)}} />
        })}
      </ul>
    )
  }
}
