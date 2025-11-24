/**
 * API Client for Layerswap API
 */
export class LayerswapApiClient {
  private apiKey?: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl: string = 'https://api.layerswap.io') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add X-LS-APIKEY header if API key is provided
    if (this.apiKey) {
      headers['X-LS-APIKEY'] = this.apiKey;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Layerswap API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new Error(`Failed to parse response as JSON: ${error}`);
    }
  }

  async get<T = any>(endpoint: string): Promise<T> {
    const result = await this.request<T>('GET', endpoint);
    return result as T;
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }
}
