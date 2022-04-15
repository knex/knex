const warning = process.env['CI'] ? 2 : 1;

module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    'plugin:markdown/recommended',
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
  ],
  overrides: [
    {
      // Code blocks in markdown file
      files: ['**/*.md/*.*'],
      rules: {
        '@typescript-eslint/no-redeclare': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-unresolved': 'off',
        'no-alert': 'off',
        'no-console': 'off',
        'no-restricted-imports': 'off',
        'no-undef': 'off',
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off',
        'max-len': ['error', { code: 60, ignoreStrings: true }],
      },
    },
  ],
  plugins: ['import', 'mocha-no-only'],
  rules: {
    'mocha-no-only/mocha-no-only': ['error'],
    'no-unused-vars': [warning, { vars: 'all', args: 'none' }],
    'no-console': 'off',
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
