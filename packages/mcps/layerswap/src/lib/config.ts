/**
 * Configuration constants for Layerswap MCP
 *
 * Note: The default API key below is a PUBLIC API key provided by Layerswap.
 * It can be used without authentication but has rate limits.
 * For production use with higher rate limits, set LAYERSWAP_API_KEY environment variable.
 */

/**
 * Default public API key for Layerswap API
 * This is a public key that can be used without authentication.
 * Can be overridden via LAYERSWAP_API_KEY environment variable.
 */
export const DEFAULT_PUBLIC_API_KEY =
  'bwDJw8c1mesRyWfO3WrOB7iE48xAkVEI5QWlgnNFHnwH/4W+zHOcRoM5D3Sne3eCXRqUzHTMXBt0hrd+lO4ASw';

/**
 * Default API URL for Layerswap API
 * Can be overridden via LAYERSWAP_API_URL environment variable.
 */
export const DEFAULT_API_URL = 'https://api.layerswap.io';

/**
 * Get the API key to use, preferring environment variable over default public key
 */
export const getApiKey = (): string => {
  return process.env.LAYERSWAP_API_KEY || DEFAULT_PUBLIC_API_KEY;
};

/**
 * Get the API URL to use, preferring environment variable over default URL
 */
export const getApiUrl = (): string => {
  return process.env.LAYERSWAP_API_URL || DEFAULT_API_URL;
};
