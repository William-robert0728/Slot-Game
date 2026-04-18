import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/** PhaserBattleBoard.jsx imports ../lib/* which resolves outside this package; send those to harness stubs. */
function phaserBoardLibRedirect() {
  const apiStub = path.resolve(__dirname, 'src/lib/api.js');
  const pixiStub = path.resolve(__dirname, 'src/lib/pixi3dRenderer.js');
  return {
    name: 'phaser-board-lib-redirect',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !/[\\/]PhaserBattleBoard\.jsx$/.test(importer)) return null;
      const s = source.replace(/\\/g, '/');
      if (
        s === '../lib/api'
        || s.endsWith('/lib/api')
        || /[/\\]lib[/\\]api(\.(js|mjs|ts|jsx|mts|cts))?$/.test(s)
      ) {
        return apiStub;
      }
      if (
        s === '../lib/pixi3dRenderer'
        || s.includes('pixi3dRenderer')
      ) {
        return pixiStub;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), phaserBoardLibRedirect()],
  resolve: {
    alias: {
      '@PhaserBattleBoard.jsx': path.resolve(repoRoot, 'PhaserBattleBoard.jsx'),
    },
  },
  server: {
    fs: {
      allow: [repoRoot, __dirname],
    },
  },
  define: {
    'import.meta.env.REACT_APP_BACKEND_URL': JSON.stringify(
      process.env.VITE_BACKEND_URL || ''
    ),
  },
});
