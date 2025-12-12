import { EKUBO_API_URL, STARKNET_CHAIN_ID } from '../constants/index.js';

/**
 * Position data structure from the new API format
 */
export interface PositionData {
  id: string;
  chain_id: string;
  positions_address: string;
  pool_key: {
    token0: string;
    token1: string;
    fee: string;
    tick_spacing: string;
    extension: string;
  };
  bounds: {
    lower: number;
    upper: number;
  };
  metadata_url?: string;
  image?: string;
  liquidity: string;
  pool_state?: {
    sqrt_ratio: string;
    tick: number;
    liquidity: string;
  };
  rewards?: Record<
    string,
    {
      amount: string;
      pending: string;
    }
  >;
}

/**
 * API response structure with pagination
 */
export interface PositionsApiResponse {
  data: PositionData[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

/**
 * Fetches positions data from the Ekubo API
 * @param ownerAddress - The owner address to fetch positions for
 * @param page - The page number (default: 1)
 * @param pageSize - The number of items per page (default: 50)
 * @param state - The state of positions to fetch: "opened" or "closed" (default: "opened")
 * @returns Positions data with pagination
 */
export async function fetchPositionData(
  ownerAddress: string | bigint,
  page: number = 1,
  pageSize: number = 50,
  state: 'opened' | 'closed' = 'opened'
): Promise<PositionsApiResponse> {
  // Convert ownerAddress to hex string if it's a bigint or number
  let normalizedAddress: string;
  if (typeof ownerAddress === 'bigint') {
    normalizedAddress = '0x' + ownerAddress.toString(16).padStart(64, '0');
  } else if (typeof ownerAddress === 'string') {
    normalizedAddress = ownerAddress.startsWith('0x')
      ? ownerAddress
      : '0x' + ownerAddress;
  } else {
    normalizedAddress = String(ownerAddress);
  }

  const url = `${EKUBO_API_URL}/positions/${normalizedAddress}?state=${state}&chainId=${STARKNET_CHAIN_ID}&pageSize=${pageSize}&page=${page}`;

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

  let data: PositionsApiResponse;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response while fetching position data: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return data;
}

/**
 * Legacy function to fetch position data by position_id
 * This is used by addLiquidity and withdrawLiquidity tools
 * @param provider - The RPC provider
 * @param positionsNFTContract - The positions NFT contract instance
 * @param positionId - The position ID to fetch
 * @param state - The state of positions to fetch: "opened" or "closed" (default: "opened")
 * @returns Position data in the old format (tick_lower, tick_upper, etc.)
 */
export async function fetchPositionDataById(
  provider: any,
  positionsNFTContract: any,
  positionId: number,
  state: 'opened' | 'closed' = 'opened'
): Promise<{
  tick_lower: string;
  tick_upper: string;
  tick_spacing: string;
  extension: string;
  fee: string;
  token0: string;
  token1: string;
}> {
  // Get owner address
  const ownerResponse = await positionsNFTContract.ownerOf(positionId);
  const ownerAddress =
    typeof ownerResponse === 'bigint'
      ? '0x' + ownerResponse.toString(16).padStart(64, '0')
      : ownerResponse.toString();

  // Fetch all positions for this owner with the specified state
  const apiResponse = await fetchPositionData(ownerAddress, 1, 100, state);

  // Find the position with matching ID
  const targetPositionHex = '0x' + BigInt(positionId).toString(16);
  const position = apiResponse.data.find(
    (pos) => pos.id.toLowerCase() === targetPositionHex.toLowerCase()
  );

  if (!position) {
    throw new Error(
      `Position with ID ${positionId} (${targetPositionHex}) not found for owner ${ownerAddress} with state "${state}"`
    );
  }

  // Convert to old format
  return {
    tick_lower: position.bounds.lower.toString(),
    tick_upper: position.bounds.upper.toString(),
    tick_spacing: BigInt(position.pool_key.tick_spacing).toString(),
    extension: position.pool_key.extension,
    fee: BigInt(position.pool_key.fee).toString(),
    token0: position.pool_key.token0,
    token1: position.pool_key.token1,
  };
}
