#!/usr/bin/env node
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildPath = join(__dirname, '..', 'build', 'index.js');

if (!existsSync(buildPath)) {
  console.error('Build not found. Run: npm run build');
  process.exit(1);
}

await import(buildPath);
