const prettierConfig = require('./.prettierrc');

module.exports = {
  plugins: ['stylelint-prettier'],
  rules: {
    'at-rule-no-unknown': null,
    'prettier/prettier': [true, prettierConfig],
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'declaration-block-no-redundant-longhand-properties': null,
  },
};
