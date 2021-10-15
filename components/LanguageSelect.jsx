import React, { PropTypes, Component } from 'react'

export default class LanguageSelect extends Component {

  static propTypes = {
    language: PropTypes.oneOf([
      'mysql', 'pg', 'redshift', 'sqlite3', 'oracle', 'mssql', 'cockroachdb'
    ]).isRequired,
    changeLanguage: PropTypes.func.isRequired
  };

  changeLanguage = (e) => {
    this.props.changeLanguage(e.target.value)
  };

  render() {
    return (
      <div className="language">
        Show example query output as:<br />
        <select value={this.props.language} onChange={this.changeLanguage}>
          <option value="mysql">MySQL / MariaDB</option>
          <option value="pg">PostgreSQL</option>
          <option value="cockroachdb">CockroachDB</option>
          <option value="redshift">Amazon Redshift</option>
          <option value="sqlite3">SQLite3</option>
          <option value="oracle">Oracle</option>
          <option value="mssql">MSSQL</option>
        </select>
      </div>

    )
  }
}
