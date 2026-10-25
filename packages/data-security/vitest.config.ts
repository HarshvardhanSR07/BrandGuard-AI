import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['tests/env.setup.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000, // first run downloads a MongoDB binary for mongodb-memory-server
    fileParallelism: false, // one in-memory MongoDB per file, run sequentially
  },
});
