module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    '@typescript-eslint/no-namespace': 0,
  },
  globals: {
    JSX: true,
    React: true,
    NodeJS: true,
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'off',
    'import/named': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
