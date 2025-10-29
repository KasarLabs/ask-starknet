#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating MCP configuration...\n');

// Load mcps.json
let mcpsConfig;
try {
  const configPath = path.join(process.cwd(), 'packages/mcp/mcps.json');
  mcpsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('✅ mcps.json loaded successfully');
} catch (error) {
  console.error('❌ Error loading mcps.json:', error.message);
  process.exit(1);
}

// Get actual MCP directories
const mcpsDir = path.join(process.cwd(), 'packages/mcps');
let actualMcps = [];
try {
  actualMcps = fs.readdirSync(mcpsDir).filter((name) => {
    const fullPath = path.join(mcpsDir, name);
    return fs.statSync(fullPath).isDirectory();
  });
  console.log('✅ Found MCP directories:', actualMcps.join(', '));
} catch (error) {
  console.error('❌ Error reading mcps directory:', error.message);
  process.exit(1);
}

// Get configured MCPs
const configuredMcps = Object.keys(mcpsConfig);
console.log('✅ Configured MCPs:', configuredMcps.join(', '));

let hasErrors = false;

// Check for missing directories
const missingDirs = configuredMcps.filter((name) => !actualMcps.includes(name));
if (missingDirs.length > 0) {
  console.error('\n❌ MCPs configured but missing directories:');
  missingDirs.forEach((name) => console.error('   -', name));
  hasErrors = true;
}

// Check for unconfigured directories
const unconfiguredDirs = actualMcps.filter(
  (name) => !configuredMcps.includes(name)
);
if (unconfiguredDirs.length > 0) {
  console.error('\n❌ MCP directories not configured in mcps.json:');
  unconfiguredDirs.forEach((name) => console.error('   -', name));
  hasErrors = true;
}

// Validate each configured MCP
console.log('\n🔍 Validating individual MCPs...');
for (const mcpName of configuredMcps) {
  console.log('\n📁 Checking', mcpName);

  const mcpDir = path.join(mcpsDir, mcpName);
  const config = mcpsConfig[mcpName];

  // Check required config structure
  if (!config.client) {
    console.error('❌ Missing client configuration');
    hasErrors = true;
    continue;
  }

  if (!config.description) {
    console.error('❌ Missing description');
    hasErrors = true;
  }

  if (!config.promptInfo) {
    console.error('❌ Missing promptInfo');
    hasErrors = true;
  } else {
    if (!config.promptInfo.expertise) {
      console.error('❌ Missing promptInfo.expertise');
      hasErrors = true;
    }
    if (!Array.isArray(config.promptInfo.tools)) {
      console.error('❌ promptInfo.tools must be an array');
      hasErrors = true;
    }
  }

  // Check if package.json exists
  const packageJsonPath = path.join(mcpDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Missing package.json');
    hasErrors = true;
  }

  // Check if src/index.ts exists
  const srcIndexPath = path.join(mcpDir, 'src', 'index.ts');
  if (!fs.existsSync(srcIndexPath)) {
    console.error('❌ Missing src/index.ts');
    hasErrors = true;
  }

  console.log('✅', mcpName, 'basic structure OK');
}

if (hasErrors) {
  console.error('\n❌ MCP validation failed!');
  process.exit(1);
} else {
  console.log('\n✅ All MCP configurations are valid!');
}
