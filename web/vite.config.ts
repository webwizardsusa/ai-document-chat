import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import svgrImport from '@svgr/rollup';

const svgr =
  (svgrImport as unknown as { default?: () => PluginOption }).default ??
  (svgrImport as unknown as () => PluginOption);

const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
} as const;

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  plugins: [svgr(), react()],
  server: {
    port: 5173,
    proxy: { ...apiProxy },
  },
  preview: {
    port: 4173,
    proxy: { ...apiProxy },
  },
});
