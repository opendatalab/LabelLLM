import { resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { viteMockServe } from 'vite-plugin-mock';

import apiUrls from './config/apiUrls';

const appDir = process.env.APP_DIR || 'src/apps/chat';
const appName = appDir.split('/').pop();
// 开启mock后，proxy将失效
const useMock = process.env.MOCK ? true : false;
const apiUrl = apiUrls[appName!];

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  publicDir: resolve(__dirname, 'public'),
  server: useMock
    ? {}
    : {
        host: true,
        port: 3000,
        proxy: {
          '/api/ws': {
            target: 'https://languagetool.shlab.tech/',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/ws/, ''),
          },
          '/api': {
            target: apiUrl,
            changeOrigin: true,
          },
        },
      },

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
      root: resolve(__dirname, appDir),
    }),
    viteMockServe({
      mockPath: 'mock',
      enable: useMock,
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
    },
  },
});
