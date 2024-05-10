import { resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { viteMockServe } from 'vite-plugin-mock';

const appDir = process.env.APP_DIR || 'src/apps/login';
// 开启mock后，proxy将失效

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  publicDir: resolve(__dirname, 'public'),
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://10.6.16.145:16666/',
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
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
    },
  },
});
