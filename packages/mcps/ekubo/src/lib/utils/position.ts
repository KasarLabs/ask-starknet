import { EKUBO_API_URL } from '../constants/index.js';

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

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch position data: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

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
