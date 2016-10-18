var warning = process.env['CI'] ? 2 : 1;

module.exports = {
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 6
  },
  "extends": [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings"
  ],
  "plugins": ["import"],
  "rules": {
    "comma-dangle": 0,
    "no-unused-vars": [warning, {"vars": "all", "args": "none"}],
    "no-console": warning,
    "no-var": 2,
    "no-debugger": warning,
    "indent": [warning, 2, {"SwitchCase": 1}],
    "max-len": [warning, 100, 2],
    "prefer-const": warning,
    "no-fallthrough": warning
  },
  "settings": {
    "import/parser": "babel-eslint"
  },
  "env": {
    "node": true,
    "es6": true
  }
};
