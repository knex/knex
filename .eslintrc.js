const ERROR = 2;
const WARN = 1;
const ERR_IN_CI = process.env['CI'] ? ERROR : WARN;

module.exports = {
  parserOptions: {
    // ECMA version 2022 is only partially supported in node version 16.0.0 (our stated minimum supported version)
    // The `n` plugin applies more granular rules, ensuring that code is valid for the target version range (>= 16),
    // but we need to overshoot it to allow some baseline syntax (e.g. class static property initializers)
    ecmaVersion: 2022,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
  ],
  plugins: ['prettier', 'import', 'mocha-no-only', 'n'],
  rules: {
    'mocha-no-only/mocha-no-only': ['error'],
    'no-unused-vars': [ERR_IN_CI, { vars: 'all', args: 'none' }],
    'no-console': 'off',
    'no-empty': 'off',
    'no-var': 2,
    'no-debugger': ERR_IN_CI,
    'prefer-const': ERR_IN_CI,
    'no-fallthrough': ERR_IN_CI,
    'require-atomic-updates': 0,
    'n/no-deprecated-api': ERR_IN_CI,
    'n/no-unsupported-features/es-builtins': ERR_IN_CI,
    'n/no-unsupported-features/es-syntax': ERR_IN_CI,
    'n/no-unsupported-features/node-builtins': ERR_IN_CI,
  },
  env: {
    node: true,
    mocha: true,
    es6: true,
  },
};
