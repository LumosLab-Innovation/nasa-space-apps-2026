import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: { exclude: ['@babylonjs/havok'] },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
