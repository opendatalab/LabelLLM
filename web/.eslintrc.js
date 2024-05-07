module.exports = {
  root: true,
  extends: [require.resolve('@shlab/fabric/dist/eslint')],
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
