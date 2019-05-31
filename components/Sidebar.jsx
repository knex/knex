import React, { Component } from 'react'

export default class Sidebar extends Component {
  render() {
    return (
      <div id="sidebar" className="interface">

        <a className="toc_title" href="#changelog">
          Knex.js <span className="version">({this.props.version})</span>
        </a>

        <ul className="toc_section">
          <li>&raquo; <a href="https://github.com/tgriesser/knex">GitHub Repository</a></li>
          <li>&raquo; <a href="#support">Support</a></li>
          <li>&raquo; <a href="#faq">FAQ</a></li>
          <li>&raquo; <a href="#changelog">Change Log</a></li>
        </ul>

        <a className="toc_title" href="#Installation">
          Installation
        </a>
        <ul className="toc_section">
          <li>– <a href="#Installation-node">Node.js</a></li>
          <li>– <a href="#Installation-browser">Browser</a></li>
          <li><b><a href="#Installation-client">Config Options:</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-client">client</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-debug">debug</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-asyncStackTraces">Async stacktraces</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-pooling">pooling</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-pooling-afterCreate">afterCreate</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-acquireConnectionTimeout">acquireConnectionTimeout</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-fetchAsString">fetchAsString</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-migrations">migrations</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-post-process-response">postProcessResponse</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-wrap-identifier">wrapIdentifier</a></li>
          <li>&nbsp;&nbsp;– <a href="#Installation-log">log</a></li>
        </ul>

        <a className="toc_title" href="#Builder">
          Query Builder
        </a>
        <ul className="toc_section">
          <li>– <a href="#Builder-identifier-syntax"><b>Identifier Syntax</b></a></li>
          <li>– <a href="#Builder-knex"><b>constructor</b></a></li>
          <li>– <a href="#Builder-timeout">timeout</a></li>
          <li>– <a href="#Builder-select">select</a></li>
          <li>– <a href="#Builder-as">as</a></li>
          <li>– <a href="#Builder-column">column</a></li>
          <li>– <a href="#Builder-from">from</a></li>
          <li>– <a href="#Builder-with">with</a></li>
          <li>– <a href="#Builder-withRecursive">withRecursive</a></li>
          <li>– <a href="#Builder-withSchema">withSchema</a></li>

          <li><b><a href="#Builder-wheres">Where Methods:</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-where">where</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereNot">whereNot</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereIn">whereIn</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereNotIn">whereNotIn</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereNull">whereNull</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereNotNull">whereNotNull</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereExists">whereExists</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereNotExists">whereNotExists</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereBetween">whereBetween</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereNotBetween">whereNotBetween</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-whereRaw">whereRaw</a></li>

          <li><b><a href="#Builder-join">Join Methods:</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-innerJoin">innerJoin</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-leftJoin">leftJoin</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-leftOuterJoin">leftOuterJoin</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-rightJoin">rightJoin</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-rightOuterJoin">rightOuterJoin</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-fullOuterJoin">fullOuterJoin</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-crossJoin">crossJoin</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-joinRaw">joinRaw</a></li>

          <li><b><a href="#Builder-on">On Methods:</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-onIn">onIn</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-onNotIn">onNotIn</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-onNull">onNull</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-onNotNull">onNotNull</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-onExists">onExists</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-onNotExists">onNotExists</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-onBetween">onBetween</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-onNotBetween">onNotBetween</a></li>

          <li><b><a href="#Builder-havings">Having Methods:</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-having">having</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-havingIn">havingIn</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-havingNotIn">havingNotIn</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-havingNull">havingNull</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-havingNotNull">havingNotNull</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-havingExists">havingExists</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-havingNotExists">havingNotExists</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-havingBetween">havingBetween</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-havingNotBetween">havingNotBetween</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-havingRaw">havingRaw</a></li>

          <li><b><a href="#Builder-clear">Clear Methods:</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-clearSelect">clearSelect</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-clearWhere">clearWhere</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-clearOrder">clearOrder</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-clearCounters">clearCounters</a></li>

          <li>– <a href="#Builder-distinct">distinct</a></li>
          <li>– <a href="#Builder-groupBy">groupBy</a></li>
          <li>– <a href="#Builder-groupByRaw">groupByRaw</a></li>
          <li>– <a href="#Builder-orderBy">orderBy</a></li>
          <li>– <a href="#Builder-orderByRaw">orderByRaw</a></li>
          <li>– <a href="#Builder-offset">offset</a></li>
          <li>– <a href="#Builder-limit">limit</a></li>
          <li>– <a href="#Builder-union">union</a></li>
          <li>– <a href="#Builder-unionAll">unionAll</a></li>
          <li>– <a href="#Builder-insert">insert</a></li>
          <li>– <a href="#Builder-returning">returning</a></li>
          <li>– <a href="#Builder-update">update</a></li>
          <li>– <a href="#Builder-del / delete">del / delete</a></li>
          <li>– <a href="#Builder-transacting">transacting</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-forUpdate">forUpdate</a></li>
          <li>&nbsp;&nbsp;– <a href="#Builder-forShare">forShare</a></li>
          <li>– <a href="#Builder-count">count</a></li>
          <li>– <a href="#Builder-min">min</a></li>
          <li>– <a href="#Builder-max">max</a></li>
          <li>– <a href="#Builder-sum">sum</a></li>
          <li>– <a href="#Builder-avg">avg</a></li>
          <li>– <a href="#Builder-increment">increment</a></li>
          <li>– <a href="#Builder-decrement">decrement</a></li>
          <li>– <a href="#Builder-truncate">truncate</a></li>
          <li>– <a href="#Builder-pluck">pluck</a></li>
          <li>– <a href="#Builder-first">first</a></li>
          <li>– <a href="#Builder-clone">clone</a></li>
          <li>– <a href="#Builder-modify">modify</a></li>
          <li>– <a href="#Builder-columnInfo">columnInfo</a></li>
          <li>– <a href="#Builder-debug">debug</a></li>
          <li>– <a href="#Builder-connection">connection</a></li>
          <li>– <a href="#Builder-options">options</a></li>
          <li>- <a href="#Builder-queryContext">queryContext</a></li>
        </ul>

        <a className="toc_title" href="#Transactions">
          Transactions
        </a>
        <ul className="toc_section">
          <li>– <a href="#Transactions"><b>overview</b></a></li>
        </ul>

        <a className="toc_title" href="#Schema">
          Schema Builder
        </a>
        <ul className="toc_section">
          <li>– <a href="#Schema-with">with</a></li>
          <li>– <a href="#Schema-withSchema">withSchema</a></li>
          <li>– <a href="#Schema-createTable">createTable</a></li>
          <li>– <a href="#Schema-renameTable">renameTable</a></li>
          <li>– <a href="#Schema-dropTable">dropTable</a></li>
          <li>– <a href="#Schema-hasColumn">hasColumn</a></li>
          <li>– <a href="#Schema-hasTable">hasTable</a></li>
          <li>– <a href="#Schema-dropTableIfExists">dropTableIfExists</a></li>
          <li>– <a href="#Schema-table">table</a></li>
          <li>– <a href="#Schema-raw">raw</a></li>
          <li>– <a href="#Schema-queryContext">queryContext</a></li>
          <li><b><a href="#Schema-Building">Schema Building:</a></b></li>
          <li>– <a href="#Schema-dropColumn">dropColumn</a></li>
          <li>– <a href="#Schema-dropColumns">dropColumns</a></li>
          <li>– <a href="#Schema-renameColumn">renameColumn</a></li>
          <li>– <a href="#Schema-increments">increments</a></li>
          <li>– <a href="#Schema-integer">integer</a></li>
          <li>– <a href="#Schema-bigInteger">bigInteger</a></li>
          <li>– <a href="#Schema-text">text</a></li>
          <li>– <a href="#Schema-string">string</a></li>
          <li>– <a href="#Schema-float">float</a></li>
          <li>– <a href="#Schema-decimal">decimal</a></li>
          <li>– <a href="#Schema-boolean">boolean</a></li>
          <li>– <a href="#Schema-date">date</a></li>
          <li>– <a href="#Schema-datetime">datetime</a></li>
          <li>– <a href="#Schema-time">time</a></li>
          <li>– <a href="#Schema-timestamp">timestamp</a></li>
          <li>– <a href="#Schema-timestamps">timestamps</a></li>
          <li>– <a href="#Schema-dropTimestamps">dropTimestamps</a></li>
          <li>– <a href="#Schema-binary">binary</a></li>
          <li>– <a href="#Schema-enum">enum / enu</a></li>
          <li>– <a href="#Schema-json">json</a></li>
          <li>– <a href="#Schema-jsonb">jsonb</a></li>
          <li>– <a href="#Schema-uuid">uuid</a></li>
          <li>– <a href="#Schema-comment">comment</a></li>
          <li>– <a href="#Schema-engine">engine</a></li>
          <li>– <a href="#Schema-charset">charset</a></li>
          <li>– <a href="#Schema-collate">collate</a></li>
          <li>– <a href="#Schema-inherits">inherits</a></li>
          <li>– <a href="#Schema-specificType">specificType</a></li>
          <li>– <a href="#Schema-index">index</a></li>
          <li>– <a href="#Schema-dropIndex">dropIndex</a></li>
          <li>– <a href="#Schema-unique">unique</a></li>
          <li>– <a href="#Schema-foreign">foreign</a></li>
          <li>– <a href="#Schema-dropForeign">dropForeign</a></li>
          <li>– <a href="#Schema-dropUnique">dropUnique</a></li>
          <li>– <a href="#Schema-dropPrimary">dropPrimary</a></li>
          <li>– <a href="#Schema-table-queryContext">queryContext</a></li>
          <li><a href="#Chainable"><b>Chainable:</b></a></li>
          <li>– <a href="#Schema-alter">alter</a></li>
          <li>– <a href="#Schema-index">index</a></li>
          <li>– <a href="#Schema-primary">primary</a></li>
          <li>– <a href="#Schema-unique">unique</a></li>
          <li>– <a href="#Schema-references">references</a></li>
          <li>– <a href="#Schema-inTable">inTable</a></li>
          <li>– <a href="#Schema-onDelete">onDelete</a></li>
          <li>– <a href="#Schema-onUpdate">onUpdate</a></li>
          <li>– <a href="#Schema-defaultTo">defaultTo</a></li>
          <li>– <a href="#Schema-unsigned">unsigned</a></li>
          <li>– <a href="#Schema-notNullable">notNullable</a></li>
          <li>– <a href="#Schema-nullable">nullable</a></li>
          <li>– <a href="#Schema-first">first</a></li>
          <li>– <a href="#Schema-after">after</a></li>
          <li>– <a href="#Column-comment">comment</a></li>
          <li>– <a href="#Column-collate">collate</a></li>
        </ul>

        <a className="toc_title" href="#Raw">
          Raw
        </a>
        <ul className="toc_section">
          <li>– <a href="#Raw-Bindings">Raw Parameter Binding</a></li>
          <li>– <a href="#Raw-Expressions">Raw Expressions</a></li>
          <li>– <a href="#Raw-Queries">Raw Queries</a></li>
          <li>- <a href="#Raw-queries-wrapped">Wrapped Queries</a></li>
        </ul>

        <a className="toc_title" href="#Ref">
         Ref
        </a>
        <ul className="toc_section">
         <li>– <a href="#Ref-Usage">Usage</a></li>
         <li>– <a href="#Ref-withSchema">withSchema</a></li>
         <li>– <a href="#Ref-alias">alias</a></li>
        </ul>


        <a className="toc_title" href="#Utility">
          Utility
        </a>
        <ul className="toc_section">
          <li>- <a href="#Utility-BatchInsert">Batch Insert</a></li>
        </ul>

        <a className="toc_title" href="#Interfaces">
          Interfaces
        </a>
        <ul className="toc_section">
          <li><b><a href="#Interfaces-Promises">Promises</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-then">then</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-catch">catch</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-tap">tap</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-map">map</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-reduce">reduce</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-bind">bind</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-return">return</a></li>
          <li><b><a href="#Interfaces-Callbacks">Callbacks</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-asCallback">asCallback</a></li>
          <li><b><a href="#Interfaces-Streams">Streams</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-stream">stream</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-pipe">pipe</a></li>
          <li><b><a href="#Interfaces-Events">Events</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-query">query</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-query-error">query-error</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-query-response">query-response</a></li>
          <li><b><a href="#Interfaces-Other">Other:</a></b></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-toString">toString</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-toSQL">toSQL</a></li>
          <li>&nbsp;&nbsp;– <a href="#Interfaces-toSQL">toSQL().toNative()</a></li>
        </ul>

        <a className="toc_title" href="#Migrations">
          Migrations
        </a>

        <ul className="toc_section">
          <li><a href="#Migrations-CLI"><b>CLI</b></a></li>
            <li>– <a href="#Migrations-CLI">Migrations</a></li>
            <li>– <a href="#Seeds-CLI">Seed files</a></li>
            <li>– <a href="#knexfile">knexfile.js</a></li>
          <li><a href="#Migrations-API"><b>Migration API</b></a></li>
            <li>– <a href="#Migrations-make">make</a></li>
            <li>– <a href="#Migrations-latest">latest</a></li>
            <li>– <a href="#Migrations-rollback">rollback</a></li>
            <ii>- <a href="#Migrations-up">up</a></ii>
            <ii>- <a href="#Migrations-down">down</a></ii>
            <li>– <a href="#Migrations-currentVersion">currentVersion</a></li>
          <li><a href="#Notes-about-locks"><b>Notes about locks</b></a></li>
          <li><a href="#Seeds-API"><b>Seed API</b></a></li>
            <li>– <a href="#Seeds-make">make</a></li>
            <li>– <a href="#Seeds-run">run</a></li>
        </ul>

        <a className="toc_title" href="#support">
          Support
        </a>

        <a className="toc_title" href="#faq">
          F.A.Q.
        </a>

        <a className="toc_title" href="#changelog">
          Change Log
        </a>
      </div>
    )
  }
}
