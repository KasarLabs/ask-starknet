import { z } from 'zod';
import { listBridgedTokensSchema } from '../schemas/index.js';
import { ListBridgedTokensResult, BridgedToken } from '../lib/types/index.js';
import { STARKGATE_ADDRESSES } from '../lib/constants/index.js';

/**
 * List all tokens supported by Starkgate bridge
 * Returns token addresses for both L1 and L2, plus bridge addresses
 *
 * @param params - List bridged tokens parameters
 * @returns {Promise<string>} JSON string with list of bridged tokens
 */
export const listBridgedTokens = async (
  params: z.infer<typeof listBridgedTokensSchema>
): Promise<string> => {
  try {
    const { network } = params;

    const addresses = STARKGATE_ADDRESSES[network];

    if (!addresses) {
      throw new Error(`Network ${network} not supported`);
    }

    const tokens: BridgedToken[] = [];

    // Add ETH
    if (addresses.ETH) {
      tokens.push({
        symbol: 'ETH',
        name: 'Ethereum',
        l1_token_address: addresses.ETH.L1_TOKEN,
        l2_token_address: addresses.ETH.L2_TOKEN,
        l1_bridge_address: addresses.ETH.L1_BRIDGE,
        l2_bridge_address: addresses.ETH.L2_BRIDGE,
      });
    }

    // Add USDC (only on Mainnet)
    if (network === 'MAINNET' && addresses.USDC) {
      tokens.push({
        symbol: 'USDC',
        name: 'USD Coin',
        l1_token_address: addresses.USDC.L1_TOKEN,
        l2_token_address: addresses.USDC.L2_TOKEN,
        l1_bridge_address: addresses.USDC.L1_BRIDGE,
        l2_bridge_address: addresses.USDC.L2_BRIDGE,
      });
    }

    const result: ListBridgedTokensResult = {
      status: 'success',
      network,
      tokens,
    };

    return JSON.stringify(result);
  } catch (error) {
    const result: ListBridgedTokensResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return JSON.stringify(result);
  }
};
