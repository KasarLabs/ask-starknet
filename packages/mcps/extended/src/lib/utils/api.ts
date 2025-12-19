import { ExtendedApiEnv } from '../types/index.js';

/**
 * Preserves precision for large numbers (like order IDs) by converting them to strings
 * This prevents JavaScript from losing precision when parsing numbers > Number.MAX_SAFE_INTEGER
 */
function preserveLargeNumberPrecision(jsonText: string): string {
  // Convert numeric IDs (16+ digits) to string IDs to preserve precision
  // This handles cases where IDs exceed Number.MAX_SAFE_INTEGER (9007199254740991)
  return jsonText.replace(
    /"id"\s*:\s*(\d{16,})/g,
    (match, idValue) => `"id":"${idValue}"`
  );
}

/**
 * Parses JSON response while preserving precision for large numbers
 */
function parseJsonWithPrecision(jsonText: string): any {
  const preservedJsonText = preserveLargeNumberPrecision(jsonText);
  return JSON.parse(preservedJsonText);
}

/**
 * Makes a GET request to the Extended API
 * Automatically extracts the 'data' field from Extended API responses
 */
export async function apiGet<T>(
  env: ExtendedApiEnv,
  endpoint: string,
  requiresAuth: boolean = false
): Promise<T> {
  const url = `${env.apiUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'User-Agent': 'SnaknetMCP/1.0',
  };

  if (requiresAuth) {
    headers['X-Api-Key'] = env.apiKey as string;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  // Get raw response text to preserve precision for large numbers
  const responseText = await response.text();
  const jsonResponse = parseJsonWithPrecision(responseText);

  // Extended API wraps responses in {"status": "OK", "data": ...}
  // Extract and return the data field directly
  if (jsonResponse.status === 'OK' && 'data' in jsonResponse) {
    return jsonResponse.data as T;
  }

  // Fallback for responses without the data wrapper
  return jsonResponse as T;
}

/**
 * Makes a POST request to the Extended API
 * Automatically extracts the 'data' field from Extended API responses
 */
export async function apiPost<T>(
  env: ExtendedApiEnv,
  endpoint: string,
  body: any
): Promise<T> {
  const url = `${env.apiUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'User-Agent': 'SnaknetMCP/1.0',
    'X-Api-Key': env.apiKey as string,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  // Get raw response text to preserve precision for large numbers
  const responseText = await response.text();
  const jsonResponse = parseJsonWithPrecision(responseText);

  // Extended API wraps responses in {"status": "OK", "data": ...}
  // Extract and return the data field directly
  if (jsonResponse.status === 'OK' && 'data' in jsonResponse) {
    return jsonResponse.data as T;
  }

  // Fallback for responses without the data wrapper
  return jsonResponse as T;
}

/**
 * Makes a PUT request to the Extended API
 * Automatically extracts the 'data' field from Extended API responses
 */
export async function apiPut<T>(
  env: ExtendedApiEnv,
  endpoint: string,
  body: any
): Promise<T> {
  const url = `${env.apiUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'User-Agent': 'SnaknetMCP/1.0',
    'X-Api-Key': env.apiKey as string,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  // Get raw response text to preserve precision for large numbers
  const responseText = await response.text();
  const jsonResponse = parseJsonWithPrecision(responseText);

  // Extended API wraps responses in {"status": "OK", "data": ...}
  // Extract and return the data field directly
  if (jsonResponse.status === 'OK' && 'data' in jsonResponse) {
    return jsonResponse.data as T;
  }

  // Fallback for responses without the data wrapper
  return jsonResponse as T;
}

/**
 * Makes a PATCH request to the Extended API
 * Automatically extracts the 'data' field from Extended API responses
 */
export async function apiPatch<T>(
  env: ExtendedApiEnv,
  endpoint: string,
  body: any
): Promise<T> {
  const url = `${env.apiUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'User-Agent': 'SnaknetMCP/1.0',
    'X-Api-Key': env.apiKey as string,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  // Get raw response text to preserve precision for large numbers
  const responseText = await response.text();
  const jsonResponse = parseJsonWithPrecision(responseText);

  // Extended API wraps responses in {"status": "OK", "data": ...}
  // Extract and return the data field directly
  if (jsonResponse.status === 'OK' && 'data' in jsonResponse) {
    return jsonResponse.data as T;
  }

  // Fallback for responses without the data wrapper
  return jsonResponse as T;
}

/**
 * Makes a DELETE request to the Extended API
 * Automatically extracts the 'data' field from Extended API responses
 */
export async function apiDelete<T>(
  env: ExtendedApiEnv,
  endpoint: string
): Promise<T> {
  const url = `${env.apiUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'User-Agent': 'SnaknetMCP/1.0',
    'X-Api-Key': env.apiKey as string,
  };

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  // Get raw response text to preserve precision for large numbers
  const responseText = await response.text();
  const jsonResponse = parseJsonWithPrecision(responseText);

  // Extended API wraps responses in {"status": "OK", "data": ...}
  // Extract and return the data field directly
  if (jsonResponse.status === 'OK' && 'data' in jsonResponse) {
    return jsonResponse.data as T;
  }

  // Fallback for responses without the data wrapper
  return jsonResponse as T;
}
