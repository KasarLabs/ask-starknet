#!/usr/bin/env node
import('../build/index.js').catch((err) => {
  console.error(err);
  process.exit(1);
});
