import React, { Component } from 'react'
import prepareTree from '../util/prepareTree'
import PropTypes from "prop-types";

export default class Section extends Component {

  static propTypes = {
    id: PropTypes.string.isRequired,
    content: PropTypes.array.isRequired
  };

  static childContextTypes = {
    section: PropTypes.string.isRequired
  };

  getChildContext() {
    return {
      section: this.props.id
    }
  }

  componentWillMount() {
    this.prepareContent(this.props.content)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.content !== this.props.content) {
      this.prepareContent(nextProps.content)
    }
  }

  prepareContent(content) {
    this.prepared = prepareTree(this.props.id, content)
  }

  render() {
    return (
      <div id={this.props.id}>
        {this.prepared}
      </div>
    )
  }
}
