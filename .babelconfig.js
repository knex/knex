'use strict';

const isDev = process.env.npm_lifecycle_event === 'dev';
const presets = [
  ["env",
    Object.assign(
      {"loose": true},
      isDev ?
        {"targets": {"node": "current"}} :
        {"targets": {"node": "6"}})]
];

module.exports = {
  "presets": presets,
  "plugins": [
    "transform-runtime",
    "add-module-exports"
  ]
};
