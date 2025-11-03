#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to source mcps.json
const mcpsJsonPath = path.resolve(__dirname, '../../../mcp/mcps.json');
// Path to output file
const outputPath = path.resolve(__dirname, '../src/lib/mcpsData.ts');

console.log('📦 Generating mcpsData.ts from mcps.json...');
console.log(`📂 Source: ${mcpsJsonPath}`);
console.log(`📝 Output: ${outputPath}`);

try {
  // Read mcps.json
  const mcpsJson = JSON.parse(fs.readFileSync(mcpsJsonPath, 'utf-8'));

  // Generate TypeScript file
  const tsContent = `// Auto-generated from packages/mcp/mcps.json
// DO NOT EDIT MANUALLY - Run 'pnpm generate:mcps-data' to update
// Generated at: ${new Date().toISOString()}

export const MCPS_DATA = ${JSON.stringify(mcpsJson, null, 2)} as const;

export type McpName = keyof typeof MCPS_DATA;

export type McpConfig = typeof MCPS_DATA[McpName];
`;

  // Write to file
  fs.writeFileSync(outputPath, tsContent, 'utf-8');

  console.log('✅ mcpsData.ts generated successfully!');
  console.log(`📊 Total MCPs: ${Object.keys(mcpsJson).length}`);
} catch (error) {
  console.error('❌ Error generating mcpsData.ts:', error);
  process.exit(1);
}
