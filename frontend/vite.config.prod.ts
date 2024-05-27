import fs from 'fs';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import shell from 'shelljs';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import svgr from 'vite-plugin-svgr';

const shouldAnalyze = process.env.ANALYZE ?? false;
const appDir = process.env.APP_DIR || 'src/apps/chat';
let buildInput: Record<string, string> = {};

if (appDir !== '*') {
  const appName = appDir.split('/').pop();

  buildInput[appName!] = resolve(__dirname, `${appDir}/index.html`);
} else {
  buildInput = fs.readdirSync(resolve(__dirname, 'src/apps')).reduce((acc: Record<string, string>, cur) => {
    if (!cur.endsWith('.ignore') && !cur.startsWith('.')) {
      acc[cur] = resolve(__dirname, `src/apps/${cur}/index.html`);
    }

    return acc;
  }, {});
}

const isTestOrProd = process.env.VITE_APP_VERSION && /^v\d+\.\d+\.\d+.*$/.test(process.env.VITE_APP_VERSION);

console.log('VITE_APP_VERSION', process.env.VITE_APP_VERSION);
console.log('SENTRY_TOKEN', process.env.SENTRY_AUTH_TOKEN_WEB);

// https://vitejs.dev/config/
export default defineConfig({
  envDir: resolve(__dirname, 'envs'),
  base: '/',
  publicDir: resolve(__dirname, 'public'),

  optimizeDeps: {
    include: ['react/jsx-runtime'],
  },

  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },

  plugins: [
    react(),
    svgr(),
    ViteEjsPlugin({
      root: '.',
      timeStamp: isTestOrProd ? Date.now() : undefined,
    }),
    shouldAnalyze && visualizer({ open: true, brotliSize: true, filename: './dist/_report.html' }),
    {
      name: 'update-dist-html-dir',
      enforce: 'pre',
      closeBundle() {
        const outDir = resolve(__dirname, 'dist');
        const sourceDir = resolve(outDir, 'src/apps');
        const destDir = resolve(outDir, 'apps');

        console.log(`${sourceDir}/*`, destDir);

        shell.mkdir('-p', destDir);
        shell.mv(`${sourceDir}/*`, destDir);
        shell.rm('-rf', resolve(outDir, 'src'));
      },
    },
  ].filter(Boolean) as PluginOption[],

  define: {
    'process.env': '{}',
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
    },
  },
  build: {
    minify: true,
    sourcemap: true,
    target: 'es2015',
    // MPA config
    rollupOptions: {
      input: buildInput,
    },
  },
});
