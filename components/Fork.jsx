import React from 'react'
import PropTypes from "prop-types";

export default function Fork({ projectUrl }) {
  return (
    <a href={projectUrl}>
      <img
        style={{position: 'fixed', top: 0, right: 0, border: 0}}
        src="assets/images/github.png"
        alt="Fork me on GitHub" />
    </a>
  )
}

Fork.propTypes = {
  projectUrl: PropTypes.string.isRequired
}
