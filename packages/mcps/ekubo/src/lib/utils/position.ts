import { EKUBO_API_URL } from '../constants/index.js';

/**
 * Fetches position owner from the Ekubo state API
 * @param positionId - The position ID to fetch
 * @returns The owner address of the position
 */
export async function fetchPositionOwner(positionId: number): Promise<string> {
  const url = `${EKUBO_API_URL}/${positionId}/state`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });
  } catch (error) {
    // Handle network errors (DNS failures, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Network error while fetching position owner: ${error.message}. This may be due to DNS resolution failure or connection refused.`
      );
    }
    throw new Error(
      `Failed to fetch position owner: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch position owner: ${response.status} ${response.statusText}`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response while fetching position owner: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Extract owner from the response
  // The API returns 'last_owner' field
  const owner =
    data.last_owner || data.owner || data.owner_address || data.ownerAddress;

  if (!owner) {
    throw new Error(`Owner not found in API response: ${JSON.stringify(data)}`);
  }

  return String(owner);
}

/**
 * Fetches position data from the Ekubo API
 * @param positionId - The position ID to fetch
 * @returns Position data including tick_lower, tick_upper, tick_spacing, extension, fee, token0, token1
 */
export async function fetchPositionData(positionId: number): Promise<{
  tick_lower: string;
  tick_upper: string;
  tick_spacing: string;
  extension: string;
  fee: string;
  token0: string;
  token1: string;
}> {
  const url = `${EKUBO_API_URL}/${positionId}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });
  } catch (error) {
    // Handle network errors (DNS failures, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Network error while fetching position data: ${error.message}. This may be due to DNS resolution failure or connection refused.`
      );
    }
    throw new Error(
      `Failed to fetch position data: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch position data: ${response.status} ${response.statusText}`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response while fetching position data: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Extract data from attributes array
  const attributes = data.attributes || [];
  const attributeMap: Record<string, string> = {};

  for (const attr of attributes) {
    if (attr.trait_type && attr.value !== undefined) {
      attributeMap[attr.trait_type] = attr.value;
    }
  }

  const tick_lower = attributeMap.tick_lower;
  const tick_upper = attributeMap.tick_upper;
  const tick_spacing = attributeMap.tick_spacing;
  const extension = attributeMap.extension;
  const fee = attributeMap.fee;
  const token0 = attributeMap.token0;
  const token1 = attributeMap.token1;

  if (
    tick_lower === undefined ||
    tick_upper === undefined ||
    tick_spacing === undefined ||
    extension === undefined ||
    fee === undefined ||
    token0 === undefined ||
    token1 === undefined
  ) {
    throw new Error(
      `Missing required position data from API response: ${JSON.stringify(attributeMap)}`
    );
  }

  return {
    tick_lower: String(tick_lower),
    tick_upper: String(tick_upper),
    tick_spacing: String(tick_spacing),
    extension: String(extension),
    fee: String(fee),
    token0: String(token0),
    token1: String(token1),
  };
}
