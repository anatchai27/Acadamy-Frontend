import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  envPrefix: ['VITE_', 'MODE_TEST_AUTH'],
  plugins: [preact(), tailwindcss()],
  // Vercel hosts this app at the project root; the VPS still serves it under /liff/.
  base: process.env.VERCEL ? '/' : '/liff/',
  server: {
    port: 5173,
    // ngrok assigns a different public hostname when a tunnel starts.
    allowedHosts: true,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  },
});
