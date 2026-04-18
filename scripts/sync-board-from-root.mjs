/**
 * Copies ../PhaserBattleBoard.jsx -> src/PhaserBattleBoard.jsx (Vercel / subfolder deploy fallback).
 * Run from repo root after editing the canonical board file.
 */
import fs from 'node:fs';
import path from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(testRoot, '..');
const src = path.join(repoRoot, 'PhaserBattleBoard.jsx');
const dest = path.join(testRoot, 'src', 'PhaserBattleBoard.jsx');

if (!fs.existsSync(src)) {
  console.error('Missing:', src);
  process.exit(1);
}
fs.copyFileSync(src, dest);
console.log('Synced', dest);
