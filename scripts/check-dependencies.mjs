#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse import statements from TypeScript files
function extractImports(content) {
  const imports = new Set();

  // Match: import ... from 'package'
  // Match: import ... from "package"
  // Match: require('package')
  const importRegex = /(?:import|require)\s*(?:.*?from\s*)?['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Skip relative imports (starting with . or /)
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      continue;
    }

    // Extract package name
    // For scoped packages: @scope/package or @scope/package/subpath
    // For regular packages: package or package/subpath
    let packageName;
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      packageName = parts.slice(0, 2).join('/');
    } else {
      packageName = importPath.split('/')[0];
    }

    // Skip node built-in modules
    const builtins = [
      'fs', 'path', 'url', 'crypto', 'http', 'https', 'net', 'os',
      'stream', 'util', 'events', 'buffer', 'child_process', 'assert',
      'node:', 'node:fs', 'node:path', 'node:url', 'node:crypto'
    ];
    if (builtins.includes(packageName) || packageName.startsWith('node:')) {
      continue;
    }

    imports.add(packageName);
  }

  return imports;
}

// Recursively find all TypeScript files in a directory
function findTypeScriptFiles(dir) {
  const files = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      // Skip node_modules, build, dist directories
      if (entry === 'node_modules' || entry === 'build' || entry === 'dist') {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findTypeScriptFiles(fullPath));
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

// Check a single MCP package
function checkMcpPackage(mcpDir) {
  const packageJsonPath = join(mcpDir, 'package.json');
  const srcDir = join(mcpDir, 'src');

  try {
    // Read package.json
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const declaredDeps = new Set([
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {})
    ]);

    // Find all TypeScript files
    const tsFiles = findTypeScriptFiles(srcDir);

    // Extract all imports from all files
    const allImports = new Set();
    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);
      imports.forEach(imp => allImports.add(imp));
    }

    // Find missing dependencies
    const missingDeps = [];
    for (const importedPackage of allImports) {
      if (!declaredDeps.has(importedPackage)) {
        missingDeps.push(importedPackage);
      }
    }

    return {
      name: packageJson.name,
      missingDeps,
      allImports: Array.from(allImports),
      declaredDeps: Array.from(declaredDeps)
    };
  } catch (error) {
    return {
      name: mcpDir,
      error: error.message
    };
  }
}

// Main function
function main() {
  const mcpsDir = join(__dirname, '../packages/mcps');

  console.log('🔍 Checking MCP packages for missing dependencies...\n');

  const mcpDirs = readdirSync(mcpsDir).filter(name => {
    const fullPath = join(mcpsDir, name);
    return statSync(fullPath).isDirectory();
  });

  let hasIssues = false;
  const results = [];

  for (const mcpName of mcpDirs) {
    const mcpPath = join(mcpsDir, mcpName);
    const result = checkMcpPackage(mcpPath);
    results.push(result);

    if (result.error) {
      console.log(`❌ ${mcpName}: Error - ${result.error}`);
      hasIssues = true;
    } else if (result.missingDeps.length > 0) {
      console.log(`⚠️  ${result.name}`);
      console.log(`   Missing dependencies: ${result.missingDeps.join(', ')}`);
      hasIssues = true;
    } else {
      console.log(`✅ ${result.name} - All dependencies declared`);
    }
  }

  console.log('\n' + '='.repeat(60));

  if (hasIssues) {
    console.log('\n⚠️  Some packages have missing dependencies!');
    console.log('These packages may fail when installed independently via npm/npx.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All packages have their dependencies properly declared!\n');
    process.exit(0);
  }
}

main();
