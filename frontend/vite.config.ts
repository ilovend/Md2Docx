import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import electron from 'vite-plugin-electron/simple';

const isElectron = process.env.ELECTRON === 'true';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Only enable Electron plugin when ELECTRON=true
    ...(isElectron
      ? [
          electron({
            main: {
              entry: 'electron/main/index.ts',
            },
            preload: {
              input: 'electron/preload/index.ts',
            },
            renderer: {},
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
