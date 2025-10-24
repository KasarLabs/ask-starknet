import { ExtendedApiEnv } from '../types/index.js';

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
    headers['X-Api-Key'] = env.apiKey;
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

  const jsonResponse = await response.json();

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
    'X-Api-Key': env.apiKey,
    'Content-Type': 'application/json',
  };
  console.error(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
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

  const jsonResponse = await response.json();

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
    'X-Api-Key': env.apiKey,
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

  const jsonResponse = await response.json();

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
    'X-Api-Key': env.apiKey,
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

  const jsonResponse = await response.json();

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
    'X-Api-Key': env.apiKey,
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

  const jsonResponse = await response.json();

  // Extended API wraps responses in {"status": "OK", "data": ...}
  // Extract and return the data field directly
  if (jsonResponse.status === 'OK' && 'data' in jsonResponse) {
    return jsonResponse.data as T;
  }

  // Fallback for responses without the data wrapper
  return jsonResponse as T;
}
