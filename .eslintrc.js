const warning = process.env['CI'] ? 2 : 1;

module.exports = {
  parser: 'babel-eslint',
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
  ],
  plugins: ['import'],
  rules: {
    'no-unused-vars': [warning, { vars: 'all', args: 'none' }],
    'no-console': warning,
    'no-var': 2,
    'no-debugger': warning,
    'prefer-const': warning,
    'no-fallthrough': warning,
  },
  settings: {
    'import/parser': 'babel-eslint',
  },
  env: {
    node: true,
    mocha: true,
  },
};
