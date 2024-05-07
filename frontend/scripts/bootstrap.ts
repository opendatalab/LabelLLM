import path from 'path';

import minimist from 'minimist';
import shell from 'shelljs';

const rootDir = path.resolve(__dirname, '..');

async function main(args: minimist.ParsedArgs) {
  const [command] = args._;
  const appDir = args.path;

  process.env.APP_DIR = appDir || '*';

  switch (command) {
    case 'build':
      shell.exec(`vite --config ${path.resolve(rootDir, 'vite.config.prod.ts')} build`);
      break;

    case 'dev':
    default:
      if (!appDir) {
        throw new Error('Missing app directory');
      }

      // 将apps/*下的index.html移动到根目录
      const indexHtml = path.resolve(rootDir, appDir, 'index.html');
      const rootIndexHtml = path.resolve(rootDir, 'index.html');
      const basename = path.basename(appDir);

      shell.cp(indexHtml, rootIndexHtml);

      console.log('starting app =>', appDir);
      console.log('index.html 文件已复制');

      shell.exec(`vite --config ${path.resolve(rootDir, 'vite.config.dev.ts')} --open ${basename}`);
      break;
  }
}

main(minimist(process.argv.slice(2)));
