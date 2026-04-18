import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const parentBoard = path.resolve(repoRoot, 'PhaserBattleBoard.jsx');
const bundledBoard = path.resolve(__dirname, 'src/PhaserBattleBoard.jsx');
/** Parent file when monorepo is checked out; bundled copy when Vercel uses app folder only as root. */
const boardPath = fs.existsSync(parentBoard) ? parentBoard : bundledBoard;
if (!fs.existsSync(boardPath)) {
  throw new Error(
    'PhaserBattleBoard.jsx missing. From repo root run: Copy-Item PhaserBattleBoard.jsx phaser-battle-board-test/src/PhaserBattleBoard.jsx (or npm run sync:board).'
  );
}

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

const fsAllow = new Set([__dirname, path.dirname(boardPath)]);
if (fs.existsSync(repoRoot)) fsAllow.add(repoRoot);

export default defineConfig({
  plugins: [react(), phaserBoardLibRedirect()],
  resolve: {
    alias: {
      '@PhaserBattleBoard.jsx': boardPath,
    },
  },
  server: {
    fs: {
      allow: [...fsAllow],
    },
  },
  define: {
    'import.meta.env.REACT_APP_BACKEND_URL': JSON.stringify(
      process.env.VITE_BACKEND_URL || ''
    ),
  },
});
