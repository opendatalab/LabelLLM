'use strict';
Object.defineProperty(exports, '__esModule', { value: !0 });
var e,
  t = require('tslib'),
  r = t.__importDefault(require('fs')),
  n = t.__importDefault(require('path')),
  a = t.__importDefault(require('lodash')),
  i = require('antd'),
  o = t.__importDefault(require('prettier')),
  l = n.default.join(__dirname, '../src/styles/global-variables.css'),
  s = n.default.join(__dirname, '../src/styles/theme.json'),
  u = (0, i.theme.defaultAlgorithm)(i.theme.defaultSeed);
try {
  var c = t.__assign(t.__assign({}, u), require(s).token),
    d = a.default
      .chain(c)
      .keys()
      .map(function (e) {
        var t = e
          .replace(/([A-Z])+/g, function (e) {
            return '-'.concat(e);
          })
          .toLowerCase();
        if (
          t.includes('size') ||
          t.includes('border-radius') ||
          t.includes('control-height') ||
          t.includes('line-width-bold')
        )
          return '--'.concat(t, ': ').concat(c[e], 'px;');
        var r = c[e];
        return (
          'number' == typeof r && r.toString().length > 5 && (r = parseFloat(r.toFixed(2))),
          '--'.concat(t, ': ').concat(r, ';')
        );
      })
      .value();
  (e =
    '\n  /**\n   * 此文件由scripts/generate_css_variables_from_antd_theme_token.ts脚本生成\n   * 请勿直接修改此文件\n   * */\n    :root {\n      '.concat(
      d.join('\n'),
      '\n    }\n  ',
    )),
    r.default.unlinkSync(l);
} catch (e) {
} finally {
  e &&
    r.default.writeFile(l, o.default.format(e, { parser: 'css' }), 'utf-8', function () {
      console.log('🎉 '.concat(l, '已生成'));
    });
}
