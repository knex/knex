'use strict';

var isDev = process.env.npm_lifecycle_event === 'dev';
var presets = [
  ["env", Object.assign({"loose": true}, isDev ? {"targets": {"node": "current"}} : {})]
];

module.exports = {
  "presets": presets,
  "plugins": [
    "lodash",
    "transform-runtime",
    "add-module-exports"
  ]
};