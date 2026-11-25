import autoprefixer from 'autoprefixer';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import { defineConfig, loadEnv } from 'vite';
import tailwindConfig from './tailwind.config.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000';

  return {
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss(tailwindConfig), autoprefixer()],
      },
    },
    server: {
      host: 'localhost',
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
