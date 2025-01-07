import { join, relative, resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

const appDir = process.env.APP_DIR || 'src/apps/login';

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
      // root: resolve(__dirname, appDir),
      root: join(__dirname, relative(__dirname, resolve(appDir))),
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
    },
  },
});
