#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating categories configuration...\n');

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

// Load categories.json
let categoriesConfig;
try {
  const categoriesPath = path.join(process.cwd(), 'packages/mcp/categories.json');
  categoriesConfig = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  console.log('✅ categories.json loaded successfully');
} catch (error) {
  console.error('❌ Error loading categories.json:', error.message);
  process.exit(1);
}

const configuredMcps = Object.keys(mcpsConfig);
let hasErrors = false;

// Validate category structure
console.log('\n🔍 Validating category structure...');
for (const [categoryName, category] of Object.entries(categoriesConfig)) {
  console.log(`\n📁 Checking category: ${categoryName}`);

  if (!category.name) {
    console.error('❌ Missing "name" field');
    hasErrors = true;
  }

  if (!category.description) {
    console.error('❌ Missing "description" field');
    hasErrors = true;
  }

  if (!Array.isArray(category.mcps)) {
    console.error('❌ "mcps" field must be an array');
    hasErrors = true;
  } else if (category.mcps.length === 0) {
    console.error('❌ "mcps" array is empty');
    hasErrors = true;
  } else {
    console.log(`✅ ${categoryName} has ${category.mcps.length} MCPs`);
  }
}

// Get all MCPs from categories
console.log('\n🔍 Validating MCP categorization...');
const categorizedMcps = new Set();
for (const [categoryName, category] of Object.entries(categoriesConfig)) {
  if (Array.isArray(category.mcps)) {
    category.mcps.forEach((mcp) => categorizedMcps.add(mcp));
  }
}

// Check for uncategorized MCPs
const uncategorizedMcps = configuredMcps.filter(
  (mcp) => !categorizedMcps.has(mcp)
);
if (uncategorizedMcps.length > 0) {
  console.error('\n❌ MCPs not categorized in categories.json:');
  uncategorizedMcps.forEach((name) => console.error('   -', name));
  hasErrors = true;
} else {
  console.log('✅ All MCPs are properly categorized');
}

// Check for categorized but non-existent MCPs
const invalidCategorizedMcps = Array.from(categorizedMcps).filter(
  (mcp) => !configuredMcps.includes(mcp)
);
if (invalidCategorizedMcps.length > 0) {
  console.error('\n❌ MCPs in categories.json but not in mcps.json:');
  invalidCategorizedMcps.forEach((name) => console.error('   -', name));
  hasErrors = true;
}

// Check for duplicate MCPs across categories
console.log('\n🔍 Checking for duplicate MCPs across categories...');
const mcpToCategories = new Map();
for (const [categoryName, category] of Object.entries(categoriesConfig)) {
  if (Array.isArray(category.mcps)) {
    category.mcps.forEach((mcp) => {
      if (!mcpToCategories.has(mcp)) {
        mcpToCategories.set(mcp, []);
      }
      mcpToCategories.get(mcp).push(categoryName);
    });
  }
}

const duplicateMcps = Array.from(mcpToCategories.entries()).filter(
  ([mcp, categories]) => categories.length > 1
);
if (duplicateMcps.length > 0) {
  console.error('\n❌ MCPs assigned to multiple categories:');
  duplicateMcps.forEach(([mcp, categories]) => {
    console.error(`   - ${mcp}: ${categories.join(', ')}`);
  });
  hasErrors = true;
} else {
  console.log('✅ No duplicate MCPs found');
}

// Summary
console.log('\n📊 Summary:');
console.log(`   Total categories: ${Object.keys(categoriesConfig).length}`);
console.log(`   Total MCPs: ${configuredMcps.length}`);
console.log(`   Categorized MCPs: ${categorizedMcps.size}`);

if (hasErrors) {
  console.error('\n❌ Category validation failed!');
  process.exit(1);
} else {
  console.log('\n✅ All category configurations are valid!');
}
