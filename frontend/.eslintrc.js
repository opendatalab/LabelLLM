module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'prettier'],
  globals: {
    JSX: true,
    React: true,
    NodeJS: true,
  },
  parserOptions: {
    project: './tsconfig.json', // Add this line
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'off',
    'import/named': 'off',
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-namespace': 0,
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'off',
  },
};
