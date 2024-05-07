import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import { theme } from 'antd';
import prettier from 'prettier';

let codeTemplate;
const targetPath = path.join(__dirname, '../src/styles/global-variables.css');
const tokenPath = path.join(__dirname, '../src/styles/theme.json');
const { defaultAlgorithm, defaultSeed } = theme;

const mapToken = defaultAlgorithm(defaultSeed);

try {
  const newTheme = {
    ...mapToken,
    ...require(tokenPath).token,
  };

  const result = _.chain(newTheme)
    .keys()
    .map((key: string) => {
      const newKey = key
        .replace(/([A-Z])+/g, (match) => {
          return `-${match}`;
        })
        .toLowerCase();
      if (
        newKey.includes('size') ||
        newKey.includes('border-radius') ||
        newKey.includes('control-height') ||
        newKey.includes('line-width-bold')
      ) {
        return `--${newKey}: ${newTheme[key]}px;`;
      }

      let value = newTheme[key];

      if (typeof value === 'number' && value.toString().length > 5) {
        value = parseFloat(value.toFixed(2));
      }

      return `--${newKey}: ${value};`;
    })
    .value();

  codeTemplate = `
  /**
   * 此文件由scripts/generate_css_variables_from_antd_theme_token.ts脚本生成
   * 请勿直接修改此文件
   * */
    :root {
      ${result.join('\n')}
    }
  `;

  fs.unlinkSync(targetPath);
} catch (err) {
} finally {
  if (codeTemplate) {
    fs.writeFile(
      targetPath,
      prettier.format(codeTemplate, {
        parser: 'css',
      }),
      'utf-8',
      () => {
        console.log(`🎉 ${targetPath}已生成`);
      },
    );
  }
}
