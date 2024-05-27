'use strict';
Object.defineProperty(exports, '__esModule', { value: !0 });
var e = require('tslib'),
  t = e.__importDefault(require('path')),
  i = e.__importDefault(require('minimist')),
  r = e.__importDefault(require('shelljs')),
  o = t.default.resolve(__dirname, '..');
!(function (i) {
  e.__awaiter(this, void 0, void 0, function () {
    var l, a, n, s, u, c;
    return e.__generator(this, function (d) {
      if (((l = e.__read(i._, 1)), (a = l[0]), (n = i.path), (process.env.APP_DIR = n || '*'), 'build' === a))
        r.default.exec('vite --config '.concat(t.default.resolve(o, 'vite.config.prod.ts'), ' build'));
      else {
        if (!n) throw new Error('Missing app directory');
        (s = t.default.resolve(o, n, 'index.html')),
          (u = t.default.resolve(o, 'index.html')),
          (c = t.default.basename(n)),
          r.default.cp(s, u),
          console.log('starting app =>', n),
          console.log('index.html 文件已复制'),
          r.default.exec('vite --config '.concat(t.default.resolve(o, 'vite.config.dev.ts'), ' --open ').concat(c));
      }
      return [2];
    });
  });
})((0, i.default)(process.argv.slice(2)));
