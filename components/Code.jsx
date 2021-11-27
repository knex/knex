import React, { Component} from 'react'
import dedent from 'dedent'
import {js, sql, ts} from '../util/highlight'
import PropTypes from "prop-types";

export default class Code extends Component {

  static propTypes = {
    language: PropTypes.string,
    content: PropTypes.string.isRequired
  };

  render() {
    const {props: {language, content}} = this
    let fn
    if (language === 'js') fn = js
    if (language === 'sql') fn = sql
    if (language === 'ts') fn = ts

    if (fn) {
      return (
        <pre><code
            className={`hljs ${language}`}
            dangerouslySetInnerHTML={{ __html: fn(dedent(content)) }} /></pre>
      )
    }

    return (
      <pre><code dangerouslySetInnerHTML={{__html: dedent(content)}} /></pre>
    )
  }
}
