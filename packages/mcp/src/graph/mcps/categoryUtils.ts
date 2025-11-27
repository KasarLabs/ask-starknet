import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Category {
  name: string;
  description: string;
  mcps: string[];
}

type CategoriesConfig = Record<string, Category>;

let categoriesConfig: CategoriesConfig | null = null;

/**
 * Load categories.json configuration
 */
function loadCategoriesConfig(): CategoriesConfig {
  if (categoriesConfig) {
    return categoriesConfig;
  }

  const categoriesPath = join(__dirname, '../../../categories.json');
  const rawData = readFileSync(categoriesPath, 'utf-8');
  categoriesConfig = JSON.parse(rawData);
  return categoriesConfig!;
}

/**
 * Get all available categories
 * @returns Array of category names
 */
export function getCategories(): string[] {
  const config = loadCategoriesConfig();
  return Object.keys(config);
}

/**
 * Get MCPs for a specific category
 * @param category - Category name
 * @returns Array of MCP names in the category
 */
export function getMCPsByCategory(category: string): string[] {
  const config = loadCategoriesConfig();
  const categoryConfig = config[category];

  if (!categoryConfig) {
    throw new Error(`Category "${category}" not found`);
  }

  return categoryConfig.mcps;
}

/**
 * Get description for a specific category
 * @param category - Category name
 * @returns Category description
 */
export function getCategoryDescription(category: string): string {
  const config = loadCategoriesConfig();
  const categoryConfig = config[category];

  if (!categoryConfig) {
    throw new Error(`Category "${category}" not found`);
  }

  return categoryConfig.description;
}

/**
 * Get the category for a specific MCP
 * @param mcpName - MCP name
 * @returns Category name or null if not found
 */
export function getCategoryForMCP(mcpName: string): string | null {
  const config = loadCategoriesConfig();

  for (const [categoryName, category] of Object.entries(config)) {
    if (category.mcps.includes(mcpName)) {
      return categoryName;
    }
  }

  return null;
}

/**
 * Get all categories with their full configuration
 * @returns Categories configuration object
 */
export function getAllCategoriesConfig(): CategoriesConfig {
  return loadCategoriesConfig();
}
