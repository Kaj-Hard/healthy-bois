import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [react()],
  // Relative base so the bundle works from the Capacitor WebView and any static host.
  base: './',
  // package.json holds "0.3.0-b" (valid semver); the app shows our hotfix style "0.3.0b".
  define: { __APP_VERSION__: JSON.stringify(pkg.version.replace(/-([a-z])$/, '$1')) },
  // The bundle ships inside the APK and loads from disk, so one ~500 kB chunk is fine.
  build: { target: 'es2020', outDir: 'dist', chunkSizeWarningLimit: 1000 },
});
