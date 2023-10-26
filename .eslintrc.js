const warning = process.env['CI'] ? 2 : 1;

module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
  ],
  plugins: ['prettier', 'import', 'mocha-no-only'],
  rules: {
    'mocha-no-only/mocha-no-only': ['error'],
    'no-unused-vars': [warning, { vars: 'all', args: 'none' }],
    'no-console': 'off',
    'no-empty': 'off',
    'no-var': 2,
    'no-debugger': warning,
    'prefer-const': warning,
    'no-fallthrough': warning,
    'require-atomic-updates': 0,
  },
  env: {
    node: true,
    mocha: true,
    es6: true,
  },
};
