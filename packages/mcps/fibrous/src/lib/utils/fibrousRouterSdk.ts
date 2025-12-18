import { createRequire } from 'node:module';
import type { Router } from 'fibrous-router-sdk';

export type FibrousRouterCtor = typeof Router;

/**
 * Returns the Fibrous Router constructor in a way that works whether
 * `fibrous-router-sdk` is resolved as ESM or CJS by the host environment.
 */
export function getFibrousRouterCtor(): FibrousRouterCtor {
  // Force the CommonJS build of fibrous-router-sdk. Their ESM build uses a ".m.js"
  // extension (not ".mjs") and may be treated as CommonJS in some Node environments.
  const require = createRequire(import.meta.url);
  const sdk: unknown = require('fibrous-router-sdk');
  const m = sdk as { Router?: unknown; default?: { Router?: unknown } };
  const RouterCtor = m.Router ?? m.default?.Router;
  if (!RouterCtor) {
    throw new Error(
      'fibrous-router-sdk: Router export not found (ESM/CJS interop issue)'
    );
  }
  return RouterCtor as FibrousRouterCtor;
}
