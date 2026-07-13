import { execSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
execSync('npx tsc', { stdio: 'inherit' });
mkdirSync('dist', { recursive: true });
cpSync('plugins.json', 'dist/plugins.json');
console.log('built math-painter-ext -> dist/');
